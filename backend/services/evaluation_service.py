import json
from services.llm_service import llm

async def evaluate_answer(
    question: str,
    answer: str,
    topic: str,
    round_name: str,
    level: str,
    what_to_look_for: str = ""
) -> dict:

    prompt = f"""
You are a strict but fair senior engineer evaluating an interview answer.

Score ONLY the candidate's actual answer to the question below.
Do NOT reward buzzwords, vague filler, or unrelated technical topics.
If the answer is off-topic, generic, or does not directly answer the question,
the score MUST be low even if a few keywords are correct.

Use this rubric:
- relevance (0-4): how directly the answer addresses the question
- correctness (0-4): whether the facts/approach are accurate
- completeness (0-2): whether the answer is complete and specific

The final score must be the sum of those three parts and must stay within 0-10.
Hard rules:
- Off-topic or mostly unrelated answers must score 0-3.
- Answers that mention random services, filler, or different problem domains must not score above 3.
- Partially correct but vague answers should score 4-6.
- High scores (7-10) are only for answers that are directly relevant, accurate, and complete.

Round: {round_name}
Topic: {topic}
Level expected: {level}
Question: {question}
What to look for: {what_to_look_for}
Candidate answer: {answer}

Return ONLY valid JSON:
{{
    "relevance_score": 3,
    "correctness_score": 3,
    "completeness_score": 2,
    "score": 8,
  "feedback": "2 sentence explanation of score",
  "strengths": "what was good",
  "weaknesses": "what was missing",
  "better_answer": "example of a strong answer",
  "next_difficulty": "easier|same|harder"
}}

Return ONLY the JSON. No explanation.
"""
    raw = await llm(prompt, task="answer_evaluation")
    raw = raw.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        parsed = json.loads(raw.strip())
        relevance = int(parsed.get("relevance_score", 0) or 0)
        correctness = int(parsed.get("correctness_score", 0) or 0)
        completeness = int(parsed.get("completeness_score", 0) or 0)
        score = int(parsed.get("score", relevance + correctness + completeness) or 0)

        # Guardrail: prevent unrelated answers from getting inflated scores.
        if relevance <= 1:
            score = min(score, 3)
        elif relevance == 2:
            score = min(score, 5)

        parsed["relevance_score"] = max(0, min(4, relevance))
        parsed["correctness_score"] = max(0, min(4, correctness))
        parsed["completeness_score"] = max(0, min(2, completeness))
        parsed["score"] = max(0, min(10, score))
        return parsed
    except Exception:
        return {
            "relevance_score": 0,
            "correctness_score": 0,
            "completeness_score": 0,
            "score": 0,
            "feedback": "Could not evaluate",
            "strengths": "",
            "weaknesses": "",
            "better_answer": "",
            "next_difficulty": "same"
        }


async def generate_report(profile: dict, all_answers: list[dict]) -> dict:
    prompt = f"""
You are a hiring manager reviewing a completed technical interview.

Candidate: {profile.get('candidate_name', 'Unknown')}
Role applied: {profile.get('role', '')}
Level: {profile.get('level', '')}

Interview answers and scores:
{json.dumps(all_answers[:20], indent=2)}

Generate a final hiring report.

Return ONLY valid JSON:
{{
  "scores_by_round": {{
    "dsa": 72.0,
    "technical": 68.0,
    "hr": 80.0
  }},
  "overall_score": 73.0,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "strong_yes|yes|maybe|no",
  "summary": "3-4 sentence overall assessment"
}}

Return ONLY the JSON. No explanation.
"""
    raw = await llm(prompt, task="report")
    raw = raw.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except Exception:
        return {
            "scores_by_round": {},
            "overall_score": 0,
            "strengths": [],
            "weaknesses": [],
            "recommendation": "maybe",
            "summary": "Could not generate report"
        }