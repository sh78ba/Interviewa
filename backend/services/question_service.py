import json
from services.llm_service import llm

ROUND_CONFIGS = {
    "dsa": {
        "name": "DSA Round",
        "count": 5,
        "task": "question_generation",
        "prompt_hint": "data structures, algorithms, time/space complexity, coding problems"
    },
    "system_design": {
        "name": "System Design Round",
        "count": 3,
        "task": "question_generation",
        "prompt_hint": "system design, scalability, databases, caching, APIs, distributed systems"
    },
    "technical": {
        "name": "Technical Round",
        "count": 6,
        "task": "question_generation",
        "prompt_hint": "language-specific, frameworks, tools, concepts from candidate's stack"
    },
    "hr": {
        "name": "HR Round",
        "count": 4,
        "task": "hr",
        "prompt_hint": "behavioural, STAR format, teamwork, conflict, growth mindset"
    },
    "cultural": {
        "name": "Cultural Fit Round",
        "count": 3,
        "task": "hr",
        "prompt_hint": "values alignment, work style, motivation, career goals"
    },
    "resume": {
        "name": "Resume Deep Dive",
        "count": 5,
        "task": "question_generation",
        "prompt_hint": "specific questions about candidate's projects, experience, and decisions"
    },
}

def _parse(raw: str) -> list[dict]:
    raw = raw.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    try:
        result = json.loads(raw)
        return result if isinstance(result, list) else []
    except Exception:
        return []

async def generate_questions(
    round_key: str,
    role: str,
    level: str,
    profile: dict,
    job_description: str = ""
) -> list[dict]:

    cfg = ROUND_CONFIGS.get(round_key, ROUND_CONFIGS["technical"])

    prompt = f"""
You are a senior {role} engineer conducting a {cfg['name']} interview.
Speak like a real interviewer talking directly to the candidate.
Write every question in a natural, conversational style using direct address like "you" or "your experience".
Do not sound robotic, instructional, or like a list of prompts.
Do not mention that you are an AI, a model, or an assistant.

Candidate level: {level}
Tech stack: {profile.get('tech_stack', [])}
Skills: {profile.get('skills', [])}
Projects: {[p['name'] for p in profile.get('projects', [])]}
Focus areas: {cfg['prompt_hint']}
Job description context: {job_description[:500] if job_description else 'Not provided'}

Generate exactly {cfg['count']} interview questions appropriate for a {level} {role} engineer.
Vary difficulty. Make them specific and realistic — not generic.
For coding questions set is_coding to true.

Return ONLY a valid JSON array:
[
  {{
    "question": "the full question text",
    "difficulty": "easy|medium|hard",
    "topic": "topic being tested",
    "what_to_look_for": "what a strong answer covers",
    "is_coding": false
  }}
]

Return ONLY the JSON array. No explanation. No markdown.
"""
    raw = await llm(prompt, task=cfg["task"])
    questions = _parse(raw)

    # Fallback if parsing fails
    if not questions:
        questions = [{
            "question": f"Can you walk me through your experience with {role} development?",
            "difficulty": "medium",
            "topic": "general",
            "what_to_look_for": "Clear communication and relevant experience",
            "is_coding": False
        }]
    return questions