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

Round: {round_name}
Topic: {topic}
Level expected: {level}
Question: {question}
What to look for: {what_to_look_for}
Candidate answer: {answer}

Score 1-10. Be strict for senior roles, lenient for junior.

Return ONLY valid JSON:
{{
  "score": 7,
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
        return json.loads(raw.strip())
    except Exception:
        return {
            "score": 5,
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