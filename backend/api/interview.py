from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel
from typing import Optional
import os, shutil, uuid

from core.database import get_db
from models.models import Interview, Question, Answer, Report
from services.resume_service import parse_pdf, extract_profile
from services.rag_service import ingest_resume, search_resume
from services.question_service import generate_questions, ROUND_CONFIGS
from services.evaluation_service import evaluate_answer, generate_report

router = APIRouter(prefix="/api/interview", tags=["interview"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Start interview ──────────────────────────────────────────────────────────
@router.post("/start")
async def start_interview(
    role: str = Form(...),
    level: str = Form(...),
    rounds: str = Form(...),           # comma-separated e.g. "resume,technical,hr"
    job_description: str = Form(""),
    resume: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    user_id = "local"
    resume_text = ""
    profile = {}

    if resume:
        path = f"{UPLOAD_DIR}/{uuid.uuid4()}.pdf"
        with open(path, "wb") as f:
            shutil.copyfileobj(resume.file, f)
        resume_text = parse_pdf(path)
        profile = await extract_profile(resume_text, role, level)

    profile["role"] = role
    profile["level"] = level

    rounds_list = [r.strip() for r in rounds.split(",")]

    interview = Interview(
        user_id="local",
        role=role,
        level=level,
        rounds=rounds_list,
        job_description=job_description,
        resume_text=resume_text,
        extracted_profile=profile,
        status="in_progress",
        current_round=0,
        current_question_index=0
    )
    db.add(interview)
    await db.flush()

    # Generate questions for all rounds
    order = 0
    for round_index, round_key in enumerate(rounds_list):
        questions = await generate_questions(round_key, role, level, profile, job_description)
        for q in questions:
            db.add(Question(
                interview_id=interview.id,
                round_name=round_key,
                round_index=round_index,
                order_index=order,
                question_text=q.get("question", ""),
                difficulty=q.get("difficulty", "medium"),
                topic=q.get("topic", ""),
                what_to_look=q.get("what_to_look_for", ""),
                is_coding=q.get("is_coding", False)
            ))
            order += 1

    if resume_text:
        await ingest_resume(interview.id, resume_text)

    await db.commit()
    return {
        "interview_id": interview.id,
        "profile": profile,
        "rounds": rounds_list,
        "message": "Interview ready. Call /next to get first question."
    }


# ── Get next question ────────────────────────────────────────────────────────
@router.get("/{interview_id}/next")
async def next_question(
    interview_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interview not found")
    if iv.status == "completed":
        return {"status": "completed", "message": "Call /report"}

    result = await db.execute(
        select(Question)
        .where(Question.interview_id == interview_id)
        .where(Question.round_index == iv.current_round)
        .order_by(Question.order_index)
    )
    questions = result.scalars().all()

    if iv.current_question_index >= len(questions):
        if iv.current_round + 1 >= len(iv.rounds):
            iv.status = "completed"
            await db.commit()
            return {"status": "completed", "message": "Call /report"}
        iv.current_round += 1
        iv.current_question_index = 0
        await db.commit()
        return await next_question(interview_id, db)

    q = questions[iv.current_question_index]

    result2 = await db.execute(select(Answer).where(Answer.interview_id == interview_id))
    answered = len(result2.scalars().all())

    result3 = await db.execute(select(Question).where(Question.interview_id == interview_id))
    total = len(result3.scalars().all())

    return {
        "question_id": q.id,
        "question": q.question_text,
        "round": q.round_name,
        "round_index": q.round_index,
        "difficulty": q.difficulty,
        "topic": q.topic,
        "is_coding": q.is_coding,
        "question_number": iv.current_question_index + 1,
        "questions_in_round": len(questions),
        "progress": f"{answered}/{total}"
    }


# ── Submit answer ────────────────────────────────────────────────────────────
class AnswerRequest(BaseModel):
    question_id: str
    answer_text: str
    code: Optional[str] = ""

@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    req: AnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Question).where(Question.id == req.question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Question not found")

    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    iv = result.scalar_one_or_none()

    answer_text = req.answer_text
    if req.code:
        answer_text += f"\n\nCode:\n{req.code}"

    # If the candidate provided no answer, treat as unanswered (score 0)
    if not answer_text.strip():
        evaluation = {
            "score": 0,
            "feedback": "No answer provided",
            "strengths": "",
            "weaknesses": "No answer",
            "better_answer": "Provide a clear, structured response explaining your approach."
        }
    else:
        evaluation = await evaluate_answer(
            question=q.question_text,
            answer=answer_text,
            topic=q.topic,
            round_name=q.round_name,
            level=iv.extracted_profile.get("level", "mid"),
            what_to_look_for=q.what_to_look
        )

    db.add(Answer(
        interview_id=interview_id,
        question_id=req.question_id,
        round_name=q.round_name,
        answer_text=req.answer_text,
        code=req.code or "",
        score=evaluation.get("score", 5),
        feedback=evaluation.get("feedback", ""),
        better_answer=evaluation.get("better_answer", "")
    ))

    iv.current_question_index += 1
    await db.commit()

    return {
        "score": evaluation.get("score"),
        "feedback": evaluation.get("feedback"),
        "strengths": evaluation.get("strengths"),
        "weaknesses": evaluation.get("weaknesses"),
        "better_answer": evaluation.get("better_answer")
    }


# ── Get report ───────────────────────────────────────────────────────────────
@router.get("/{interview_id}/report")
async def get_report(
    interview_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Not found")

    result = await db.execute(select(Answer).where(Answer.interview_id == interview_id))
    answers = result.scalars().all()

    all_answers = []
    for a in answers:
        result = await db.execute(select(Question).where(Question.id == a.question_id))
        q = result.scalar_one_or_none()
        all_answers.append({
            "round": a.round_name,
            "question": q.question_text if q else "",
            "answer": a.answer_text,
            "score": a.score,
            "feedback": a.feedback
        })

    report_data = await generate_report(iv.extracted_profile, all_answers)

    result = await db.execute(select(Report).where(Report.interview_id == interview_id))
    existing = result.scalar_one_or_none()
    if not existing:
        db.add(Report(
            interview_id=interview_id,
            scores_by_round=report_data.get("scores_by_round", {}),
            overall_score=report_data.get("overall_score", 0),
            strengths=report_data.get("strengths", []),
            weaknesses=report_data.get("weaknesses", []),
            recommendation=report_data.get("recommendation", "maybe"),
            summary=report_data.get("summary", "")
        ))
        await db.commit()

    return {
        "candidate": iv.extracted_profile.get("candidate_name"),
        "role": iv.role,
        "level": iv.level,
        "report": report_data,
        "detailed_answers": all_answers
    }


# ── List interviews ───────────────────────────────────────────────────────────
@router.get("/")
async def list_interviews(
    page: int = 1,
    limit: int = 5,
    db: AsyncSession = Depends(get_db)
):
    page = max(page, 1)
    limit = max(min(limit, 20), 1)

    total_result = await db.execute(
        select(func.count())
        .select_from(Interview)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(Interview)
        .order_by(Interview.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    interviews = result.scalars().all()

    return {
        "items": [
            {
                "id": i.id,
                "role": i.role,
                "level": i.level,
                "status": i.status,
                "rounds": i.rounds,
                "created_at": str(i.created_at)
            }
            for i in interviews
        ],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": max((total + limit - 1) // limit, 1) if total else 0
    }


# ── Delete interview ────────────────────────────────────────────────────────
@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(404, "Interview not found")

    await db.execute(delete(Answer).where(Answer.interview_id == interview_id))
    await db.execute(delete(Question).where(Question.interview_id == interview_id))
    await db.execute(delete(Report).where(Report.interview_id == interview_id))
    await db.execute(delete(Interview).where(Interview.id == interview_id))
    await db.commit()

    return {"message": "Interview deleted"}