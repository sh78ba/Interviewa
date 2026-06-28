from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel
from typing import Optional
import os, shutil, uuid, asyncio, json

from core.database import get_db
from models.models import Interview, Question, Answer, Report
from services.resume_service import parse_pdf, extract_profile
from services.rag_service import ingest_resume, search_resume, delete_resume
from services.question_service import generate_questions, ROUND_CONFIGS
from services.evaluation_service import evaluate_answer, generate_report
from api.dependencies import get_user_session, get_ai_credentials
from core.logger import logger

router = APIRouter(prefix="/api/interview", tags=["interview"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Detect rounds dynamically ──────────────────────────────────────────────────
@router.post("/detect-rounds")
async def detect_rounds(
    company: str = Form(...),
    role: Optional[str] = Form(None),
    level: str = Form(...),
    creds: dict = Depends(get_ai_credentials)
):
    """
    Search the web for the company's interview process and stages,
    then ask LLM to extract a dynamic list of rounds.
    """
    company_cleaned = company.strip()
    role_cleaned = role.strip() if (role and role.strip()) else "Software Engineer"
    level_cleaned = level.strip()

    logger.info(f"Detecting rounds for company: '{company_cleaned}', role: '{role_cleaned}', level: '{level_cleaned}'")

    if not company_cleaned:
        return {
            "rounds": [],
            "label": "Generic Loop",
            "rationale": "No company specified."
        }

    scraped_context = ""
    try:
        from services.duckduckgo_service import search_duckduckgo
        query = f"{company_cleaned} {role_cleaned} {level_cleaned} interview process rounds stages"
        results = await search_duckduckgo(query)
        if results:
            scraped_context = "\n\n".join([
                f"Title: {r['title']}\nSnippet: {r['snippet']}"
                for r in results[:6]
            ])
    except Exception as e:
        print(f"Error scraping for detect-rounds: {e}")

    company_lower = company_cleaned.lower().replace(" ", "")
    prompt = f"""
You are an expert technical recruiter and system coordinator.
Your task is to analyze real-world search results about the interview process at a company, and determine the typical interview loop (sequence of rounds) for the specified candidate level and role.

Company: {company_cleaned}
Role: {role_cleaned}
Level: {level_cleaned}

Search Results:
{scraped_context}

Based on the search results and your knowledge of {company_cleaned}, extract the typical interview rounds.
Map each round to one of these valid round keys:
1. `{company_lower}_coding` (for coding/DSA/technical coding rounds)
2. `{company_lower}_system_design` (for system design, architecture, or OOD design rounds)
3. `{company_lower}_behavioral` (for HR, behavioral, values, leadership, or culture fit rounds)
4. `resume` (for resume deep dive)
5. `dsa` (generic coding)
6. `system_design` (generic system design)
7. `technical` (generic technical core)
8. `hr` (generic HR/behavioral)
9. `cultural` (generic cultural fit)

Guidelines:
- Return a typical sequence of 3 to 5 rounds.
- For each round, provide a friendly display name (e.g. "Integration Coding", "Scale System Design", "Values Alignment & Leadership") and a specific question count (1 to 3 questions).
- For each round, provide a clear instruction string (e.g. "Focus on Stripe's integration-heavy coding challenge...") to help the question generator.
- If the search results do not specify enough detail, fallback to a standard loop for the level:
  - Junior/Mid: 2x coding, 1x behavioral (e.g. `{company_lower}_coding` with count 1, `{company_lower}_coding` with count 1, `{company_lower}_behavioral` with count 2)
  - Senior/Staff: 2x coding, 1x system design, 1x behavioral (e.g. `{company_lower}_coding` with count 1, `{company_lower}_coding` with count 1, `{company_lower}_system_design` with count 1, `{company_lower}_behavioral` with count 2)

Return ONLY a valid JSON object with the following fields:
- "rounds": A list of objects, where each object represents a round and has:
    - "key": string (one of the valid round keys, e.g. "{company_lower}_coding")
    - "name": string (user-friendly display name, e.g. "Practical Integration Coding")
    - "count": integer (number of questions to generate for this round)
    - "instruction": string (critical instructions/prompts for this round's questions)
- "label": A short, user-friendly summary of the loop (e.g. "2x Technical Coding, 1x System Design, 1x Behavioral").
- "rationale": A brief 1-2 sentence explanation of why these rounds were selected based on the web search.

Return ONLY the JSON object. Do not include markdown formatting (like ```json), explanations, or extra text.
"""
    
    rounds_data = {}
    try:
        from services.llm_service import llm
        raw = await llm(
            prompt, 
            task="question_generation", 
            ai_service_url=creds["ai_service_url"], 
            groq_api_key=creds["groq_api_key"]
        )
        raw = raw.strip()
        start_idx = raw.find('{')
        end_idx = raw.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = raw[start_idx:end_idx + 1]
            rounds_data = json.loads(json_str)
        else:
            rounds_data = json.loads(raw)
    except Exception as e:
        print(f"Error parsing LLM response in detect-rounds: {e}")
        
    if not rounds_data or "rounds" not in rounds_data or not rounds_data["rounds"]:
        fallback_rounds = []
        if level_cleaned in ["senior", "staff"]:
            fallback_rounds = [
                {
                    "key": f"{company_lower}_coding",
                    "name": f"{company_cleaned} Coding",
                    "count": 1,
                    "instruction": f"Generate 1 algorithmic coding problem in the style of actual {company_cleaned} interview questions. Set is_coding to true."
                },
                {
                    "key": f"{company_lower}_coding",
                    "name": f"{company_cleaned} Coding",
                    "count": 1,
                    "instruction": f"Generate 1 algorithmic coding problem in the style of actual {company_cleaned} interview questions. Set is_coding to true."
                },
                {
                    "key": f"{company_lower}_system_design",
                    "name": f"{company_cleaned} System Design",
                    "count": 1,
                    "instruction": f"Generate 1 distributed system design question in the style of actual {company_cleaned} interviews. Set is_coding to false."
                },
                {
                    "key": f"{company_lower}_behavioral",
                    "name": f"{company_cleaned} Behavioral & Fit",
                    "count": 2,
                    "instruction": f"Focus on behavioral scenarios highlighting alignment with {company_cleaned} values. Set is_coding to false."
                }
            ]
            label = "2x Coding, 1x System Design, 1x Behavioral"
            rationale = f"Using standard senior loop configuration for {company_cleaned} as a fallback."
        else:
            fallback_rounds = [
                {
                    "key": f"{company_lower}_coding",
                    "name": f"{company_cleaned} Coding",
                    "count": 1,
                    "instruction": f"Generate 1 algorithmic coding problem in the style of actual {company_cleaned} interview questions. Set is_coding to true."
                },
                {
                    "key": f"{company_lower}_coding",
                    "name": f"{company_cleaned} Coding",
                    "count": 1,
                    "instruction": f"Generate 1 algorithmic coding problem in the style of actual {company_cleaned} interview questions. Set is_coding to true."
                },
                {
                    "key": f"{company_lower}_behavioral",
                    "name": f"{company_cleaned} Behavioral & Fit",
                    "count": 2,
                    "instruction": f"Focus on behavioral scenarios highlighting alignment with {company_cleaned} values. Set is_coding to false."
                }
            ]
            label = "2x Coding, 1x Behavioral"
            rationale = f"Using standard mid/junior loop configuration for {company_cleaned} as a fallback."

        rounds_data = {
            "rounds": fallback_rounds,
            "label": label,
            "rationale": rationale,
            "is_fallback": True
        }

    logger.info(f"Rounds detected for '{company_cleaned}': is_fallback={rounds_data.get('is_fallback', False)}, label='{rounds_data.get('label')}'")
    return rounds_data


# ── Start interview ──────────────────────────────────────────────────────────
@router.post("/start")
async def start_interview(
    role: Optional[str] = Form(None),
    level: str = Form(...),
    rounds: str = Form(...),           # comma-separated e.g. "resume,technical,hr"
    job_description: str = Form(""),
    company: Optional[str] = Form(""),
    resume: Optional[UploadFile] = File(None),
    custom_rounds_config: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session),
    creds: dict = Depends(get_ai_credentials)
):
    role = role.strip() if (role and role.strip()) else "Software Engineer"
    logger.info(f"Starting interview: company='{company}', role='{role}', level='{level}', rounds='{rounds}'")
    resume_text = ""
    profile = {}

    if resume:
        path = f"{UPLOAD_DIR}/{uuid.uuid4()}.pdf"
        try:
            with open(path, "wb") as f:
                shutil.copyfileobj(resume.file, f)
            resume_text = parse_pdf(path)
            logger.info("Resume uploaded and parsed successfully.")
        finally:
            if os.path.exists(path):
                os.remove(path)
        profile = await extract_profile(
            resume_text,
            role,
            level,
            ai_service_url=creds["ai_service_url"],
            groq_api_key=creds["groq_api_key"]
        )
        logger.info(f"Resume profile extracted: candidate='{profile.get('candidate_name', 'Unknown')}', skills_count={len(profile.get('skills', []))}")

    profile["role"] = role
    profile["level"] = level

    # Fetch scraped context if company is specified
    scraped_context = ""
    if company:
        try:
            from services.duckduckgo_service import search_duckduckgo
            query1 = f"{company} {level} {role} interview questions experience"
            query2 = f"site:github.com {company} interview questions {role}"
            
            # Fetch both general and GitHub results concurrently
            results = await asyncio.gather(
                search_duckduckgo(query1),
                search_duckduckgo(query2),
                return_exceptions=True
            )
            
            scraped_results = []
            
            # Extract and merge results (top 4 general, top 3 github)
            if len(results) > 0 and isinstance(results[0], list):
                scraped_results.extend(results[0][:4])
            if len(results) > 1 and isinstance(results[1], list):
                scraped_results.extend(results[1][:3])
                
            if scraped_results:
                scraped_context = "\n\n".join([
                    f"Title: {r['title']}\nSnippet: {r['snippet']}"
                    for r in scraped_results
                ])
        except Exception as e:
            print(f"Error scraping DuckDuckGo: {e}")

    rounds_list = []
    round_counts = {}
    for idx, r in enumerate(rounds.split(",")):
        r = r.strip()
        if not r:
            continue
        if ":" in r:
            parts = r.split(":")
            round_key = parts[0].strip()
            try:
                count = int(parts[1])
            except ValueError:
                count = None
            rounds_list.append(round_key)
            if count is not None:
                round_counts[idx] = count
        else:
            rounds_list.append(r)

    # Parse custom_rounds_config if present
    custom_cfg_map = {}
    if custom_rounds_config:
        try:
            custom_data = json.loads(custom_rounds_config)
            if isinstance(custom_data, list):
                for r_item in custom_data:
                    if isinstance(r_item, dict) and "key" in r_item:
                        custom_cfg_map[r_item["key"]] = r_item
            elif isinstance(custom_data, dict):
                custom_cfg_map = custom_data
        except Exception as e:
            print(f"Error parsing custom_rounds_config: {e}")

    interview = Interview(
        user_id=user_id,
        role=role,
        level=level,
        company=company,
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
        count = round_counts.get(round_index)
        
        dynamic_cfg = None
        dynamic_instruction = None
        custom_info = custom_cfg_map.get(round_key, {})
        if custom_info:
            dynamic_instruction = custom_info.get("instruction")
            if "cfg" in custom_info and isinstance(custom_info["cfg"], dict):
                dynamic_cfg = custom_info["cfg"]
            elif "name" in custom_info:
                suffix = round_key.split("_")[-1] if "_" in round_key else "technical"
                dynamic_cfg = {
                    "name": custom_info["name"],
                    "count": count or custom_info.get("count", 1),
                    "task": "hr" if suffix in ["behavioral", "cultural", "hr", "googleyness", "leadership"] or round_key in ["hr", "cultural", "googleyness", "meta_behavioral", "amazon_leadership", "microsoft_behavioral", "netflix_culture", "apple_behavioral"] else "question_generation",
                    "prompt_hint": custom_info.get("prompt_hint", f"Specific questions for {custom_info['name']}")
                }

        display_round_name = (custom_info.get("name") or 
                              (dynamic_cfg.get("name") if dynamic_cfg else None) or 
                              round_key)

        questions = await generate_questions(
            round_key,
            role,
            level,
            profile,
            job_description,
            ai_service_url=creds["ai_service_url"],
            groq_api_key=creds["groq_api_key"],
            company=company,
            scraped_context=scraped_context,
            count=count,
            dynamic_cfg=dynamic_cfg,
            dynamic_instruction=dynamic_instruction
        )
        for q in questions:
            db.add(Question(
                interview_id=interview.id,
                round_name=display_round_name,
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
        await ingest_resume(interview.id, resume_text, ai_service_url=creds["ai_service_url"])

    await db.commit()
    logger.info(f"Created interview session successfully: ID={interview.id}, questions_count={order}")
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
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session)
):
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
        .where(Interview.user_id == user_id)
    )
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
        return await next_question(interview_id, db=db, user_id=user_id)

    q = questions[iv.current_question_index]

    result2 = await db.execute(select(Answer).where(Answer.interview_id == interview_id))
    answered = len(result2.scalars().all())

    result3 = await db.execute(select(Question).where(Question.interview_id == interview_id))
    total = len(result3.scalars().all())

    logger.info(f"Serving next question: interview_id='{interview_id}', round='{q.round_name}' (index {q.round_index}), question_text='{q.question_text[:60]}...'")
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
        "progress": f"{iv.current_question_index + 1}/{len(questions)}"
    }


# ── Evaluate pending answers helper ──────────────────────────────────────────
async def evaluate_pending_answers(
    interview_id: str,
    db: AsyncSession,
    creds: dict,
    extracted_profile: dict
):
    result = await db.execute(
        select(Answer, Question)
        .join(Question, Answer.question_id == Question.id)
        .where(Answer.interview_id == interview_id)
        .where(Answer.score == -1.0)
    )
    pending = result.all()
    if not pending:
        return

    logger.info(f"Evaluating pending answers for interview_id='{interview_id}' (count: {len(pending)})")

    sem = asyncio.Semaphore(5)

    async def eval_one(ans_obj: Answer, q_obj: Question):
        async with sem:
            combined_text = ans_obj.answer_text
            if ans_obj.code:
                combined_text += f"\n\nCode:\n{ans_obj.code}"

            evaluation = await evaluate_answer(
                question=q_obj.question_text,
                answer=combined_text,
                topic=q_obj.topic,
                round_name=q_obj.round_name,
                level=extracted_profile.get("level", "mid") if extracted_profile else "mid",
                what_to_look_for=q_obj.what_to_look,
                is_coding=q_obj.is_coding,
                ai_service_url=creds.get("ai_service_url"),
                groq_api_key=creds.get("groq_api_key")
            )
            ans_obj.score = evaluation.get("score", 5)
            ans_obj.feedback = evaluation.get("feedback", "")
            ans_obj.better_answer = evaluation.get("better_answer", "")
            logger.info(f"Evaluated answer for question ID '{q_obj.id}': score={ans_obj.score}")

    await asyncio.gather(*(eval_one(a, q) for a, q in pending))
    await db.commit()


# ── Submit answer ────────────────────────────────────────────────────────────
class AnswerRequest(BaseModel):
    question_id: str
    answer_text: str
    code: Optional[str] = ""

@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    req: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session),
    creds: dict = Depends(get_ai_credentials)
):
    result = await db.execute(select(Question).where(Question.id == req.question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Question not found")

    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
        .where(Interview.user_id == user_id)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interview not found")

    db.add(Answer(
        interview_id=interview_id,
        question_id=req.question_id,
        round_name=q.round_name,
        answer_text=req.answer_text,
        code=req.code or "",
        score=-1.0,
        feedback="Pending evaluation",
        better_answer=""
    ))

    iv.current_question_index += 1
    await db.commit()

    logger.info(f"User submitted answer: interview_id='{interview_id}', question_id={req.question_id}")
    return {
        "score": -1.0,
        "feedback": "Pending evaluation",
        "strengths": "",
        "weaknesses": "",
        "better_answer": ""
    }


# ── End interview ────────────────────────────────────────────────────────────
@router.post("/{interview_id}/end")
async def end_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session),
    creds: dict = Depends(get_ai_credentials)
):
    logger.info(f"Ending interview session early: ID={interview_id}")
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
        .where(Interview.user_id == user_id)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Interview not found")
    iv.status = "completed"

    # Find all questions for this interview
    q_result = await db.execute(select(Question).where(Question.interview_id == interview_id))
    questions = q_result.scalars().all()

    # Find already answered questions
    a_result = await db.execute(select(Answer).where(Answer.interview_id == interview_id))
    answered_q_ids = {a.question_id for a in a_result.scalars().all()}

    # Insert dummy answers with score 0 for unanswered ones
    for q in questions:
        if q.id not in answered_q_ids:
            db.add(Answer(
                interview_id=interview_id,
                question_id=q.id,
                round_name=q.round_name,
                answer_text="No answer provided (interview ended early)",
                code="",
                score=0,
                feedback="This question was not answered because the interview was terminated early.",
                better_answer="Provide a complete response to this question to get feedback."
            ))

    await db.commit()

    # Evaluate any pending answers
    await evaluate_pending_answers(
        interview_id=interview_id,
        db=db,
        creds=creds,
        extracted_profile=iv.extracted_profile or {}
    )

    return {"status": "completed", "message": "Interview ended"}


# ── Get report ───────────────────────────────────────────────────────────────
@router.get("/{interview_id}/report")
async def get_report(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session),
    creds: dict = Depends(get_ai_credentials)
):
    logger.info(f"Generating/retrieving report for interview: ID={interview_id}")
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
        .where(Interview.user_id == user_id)
    )
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(404, "Not found")

    # Evaluate pending answers first
    await evaluate_pending_answers(
        interview_id=interview_id,
        db=db,
        creds=creds,
        extracted_profile=iv.extracted_profile or {}
    )

    # Now get all answers
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

    report_data = await generate_report(
        iv.extracted_profile or {},
        all_answers,
        ai_service_url=creds["ai_service_url"],
        groq_api_key=creds["groq_api_key"]
    )

    logger.info(f"Report generated: overall_score={report_data.get('overall_score')}, recommendation='{report_data.get('recommendation')}'")
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
        "candidate": iv.extracted_profile.get("candidate_name") if iv.extracted_profile else "Unknown",
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
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session)
):
    page = max(page, 1)
    limit = max(min(limit, 20), 1)

    total_result = await db.execute(
        select(func.count())
        .select_from(Interview)
        .where(Interview.user_id == user_id)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(Interview)
        .where(Interview.user_id == user_id)
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
                "company": i.company,
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
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_session)
):
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id)
        .where(Interview.user_id == user_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(404, "Interview not found")

    await db.execute(delete(Answer).where(Answer.interview_id == interview_id))
    await db.execute(delete(Question).where(Question.interview_id == interview_id))
    await db.execute(delete(Report).where(Report.interview_id == interview_id))
    await db.execute(delete(Interview).where(Interview.id == interview_id))
    await db.commit()

    # Clean up RAG/ChromaDB data
    await delete_resume(interview_id)

    return {"message": "Interview deleted"}