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

ROUND_INSTRUCTIONS = {
    "resume": """
This is a Resume Deep Dive round.
CRITICAL INSTRUCTIONS:
- You MUST focus ONLY and strictly on the candidate's resume (their projects, experience, choices, achievements, and technical stack described in their resume profile).
- Do not ask generic questions. Every question must relate directly to something on the candidate's resume.
- If no resume profile, skills, or projects are available, ask general questions about the candidate's past real-world project experience, their specific role in it, and key decisions they made.
- Set "is_coding" to false for all questions.
""",
    "dsa": """
This is a DSA & Coding round.
CRITICAL INSTRUCTIONS:
- You MUST generate ONLY coding questions (algorithm and data structure problems).
- Do not ask theoretical or conversational questions.
- Set "is_coding" to true for EVERY question in this round.
""",
    "system_design": """
This is a System Design round.
CRITICAL INSTRUCTIONS:
- You MUST split the questions: exactly 50% must be High-Level Design (HLD) questions (e.g., scalability, microservices, databases, system architecture, caching, CDNs) and exactly 50% must be Low-Level Design (LLD) questions (e.g., class/component design, database schema design, design patterns, API signatures, concurrency).
- For all High-Level Design (HLD) questions, set "is_coding" to false.
- For all Low-Level Design (LLD) questions, the candidate is required to write code (e.g. implementing class structures, interface designs, pattern templates, or schema classes). You MUST set "is_coding" to true for all Low-Level Design (LLD) questions.
""",
    "technical": """
This is a Technical Core round.
CRITICAL INSTRUCTIONS:
- You MUST ask core subject questions as well as other technical stack questions.
- Maintain a balance of approximately 40% core computer science subject questions (e.g., database indexing/transactions, OS threads/processes/memory management, computer networking protocols, OOP/FP fundamentals) and 60% other technical questions (specific language features, frameworks, libraries, and tools relevant to the candidate's stack).
- Set "is_coding" to false for these questions.
""",
    "hr": """
This is an HR / Behavioral round.
CRITICAL INSTRUCTIONS:
- Focus strictly on HR-related, behavioral traits, soft skills, teamwork, handling conflict, career growth, and situational scenarios.
- Do NOT ask any technical questions, coding problems, language-specific syntax questions, or system design questions.
- Set "is_coding" to false for all questions.
""",
    "cultural": """
This is a Cultural Fit round.
CRITICAL INSTRUCTIONS:
- Focus strictly on cultural alignment, work style preferences, collaboration, motivation, company values fit, and career goals.
- Do NOT ask any technical or coding questions.
- Set "is_coding" to false for all questions.
"""
}

async def generate_questions(
    round_key: str,
    role: str,
    level: str,
    profile: dict,
    job_description: str = "",
    ai_service_url: str = None,
    groq_api_key: str = None
) -> list[dict]:

    cfg = ROUND_CONFIGS.get(round_key, ROUND_CONFIGS["technical"])
    round_instruction = ROUND_INSTRUCTIONS.get(round_key, "")

    tech_stack = profile.get("tech_stack", [])
    skills = profile.get("skills", [])
    projects = [p.get("name", "") for p in profile.get("projects", []) if isinstance(p, dict)] if isinstance(profile.get("projects"), list) else []

    is_behavioral = round_key in ["hr", "cultural"]

    if is_behavioral:
        prompt = f"""
You are an HR recruiter, hiring manager, or cultural interviewer conducting a {cfg['name']} for a {level} {role} position.
Speak like a real interviewer talking directly to the candidate.
Write every question in a natural, conversational style using direct address like "you" or "your experience".
Do not sound robotic, instructional, or like a list of prompts.
Do not mention that you are an AI, a model, or an assistant.

Candidate Role: {role}
Candidate Level: {level}
Job Description Context: {job_description[:1000] if job_description else 'Not provided'}
Resume Profile Context: {json.dumps(profile) if profile else 'Not provided'}

{round_instruction}

Generate exactly {cfg['count']} interview questions.
CRITICAL: You MUST adjust the difficulty, complexity, and theme of your questions to be perfectly tailored for a {level}-level {role}.
Calibrate your questions according to the candidate's resume/profile details and the Job Description context. Tailor the scenarios to match the responsibilities of the role and company context if provided.

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
    else:
        prompt = f"""
You are a senior {role} engineer conducting a {cfg['name']} interview.
Speak like a real interviewer talking directly to the candidate.
Write every question in a natural, conversational style using direct address like "you" or "your experience".
Do not sound robotic, instructional, or like a list of prompts.
Do not mention that you are an AI, a model, or an assistant.

Candidate Role: {role}
Candidate Level: {level}
Candidate Tech Stack: {tech_stack}
Candidate Skills: {skills}
Candidate Projects: {projects}
Job Description Context: {job_description[:1000] if job_description else 'Not provided'}
Full Resume Profile Context: {json.dumps(profile) if profile else 'Not provided'}

{round_instruction}

Generate exactly {cfg['count']} interview questions appropriate for a {level} {role} engineer.
Vary difficulty. Make them specific and realistic — not generic.
You MUST adjust the difficulty, complexity, and technical depth of your questions to be perfectly tailored for a {level}-level {role}.
Calibrate and adapt your questions according to the candidate's resume details and the Job Description context (e.g. prioritize technologies mentioned in the JD or candidate stack).

Return ONLY a valid JSON array:
[
  {{
    "question": "the full question text",
    "difficulty": "easy|medium|hard",
    "topic": "topic being tested",
    "what_to_look_for": "what a strong answer covers",
    "is_coding": true_or_false_based_on_instructions
  }}
]

Return ONLY the JSON array. No explanation. No markdown.
"""
    raw = await llm(prompt, task=cfg["task"], ai_service_url=ai_service_url, groq_api_key=groq_api_key)
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