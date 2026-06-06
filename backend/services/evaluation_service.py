import json
from services.llm_service import llm

async def evaluate_answer(
    question: str,
    answer: str,
    topic: str,
    round_name: str,
    level: str,
    what_to_look_for: str = "",
    ai_service_url: str = None,
    groq_api_key: str = None
) -> dict:

    is_behavioral = round_name.lower() in ["hr", "cultural", "behavioural", "behavioral"]
    star_instruction = ""
    if is_behavioral:
        star_instruction = """
This is a Behavioral / HR question. You MUST evaluate the response using the STAR method:
- Situation (S): Did the candidate set the scene and provide necessary context?
- Task (T): Did they explain their specific responsibility or challenge?
- Action (A): Did they describe the specific actions they took (what they did, how, and why)?
- Result (R): Did they share the outcome, including any positive metrics or lessons learned?

Check which of these four elements are present, missing, or weak. In the feedback, structure your evaluation showing the STAR breakdown. If the candidate failed to explain a clear Result (R) or Action (A), penalize the completeness score.
"""

    prompt = f"""
You are a strict but fair senior engineer evaluating an interview answer.

You are evaluating the candidate's answer to this question:
Question: {question}

Here is the reference criteria/expected answer details of what a strong answer should cover:
{what_to_look_for}

Candidate's Answer: {answer}

Evaluation details:
Round: {round_name}
Topic: {topic}
Level expected: {level}

CRITICAL RULES:
1. If the candidate's answer is off-topic, completely unrelated to the question, or consists of meta-talk/test phrases (e.g., testing the microphone, testing the audio, checking if it works, "this is a test"), you MUST score it 0.
2. If the candidate simply repeats the question back to you, or asks a question back, or slightly modifies the question without answering it, you MUST score it 0.
3. If the candidate's answer is empty or has only filler words (e.g., "I don't know", "skip", "test"), you MUST score it 0.
4. Do NOT reward buzzwords, vague filler, or unrelated technical topics.

{star_instruction}

Scoring Rubric:
- relevance_score: integer from 0 to 4 (how directly the answer addresses the question)
- correctness_score: integer from 0 to 4 (whether the facts/approach/behavior are accurate/appropriate)
- completeness_score: integer from 0 to 2 (whether the answer is complete and covers expected details/STAR elements)
- score: total score (sum of relevance_score + correctness_score + completeness_score, from 0 to 10)

Return ONLY a valid JSON object. Do not include comments or markdown formatting.
Format the JSON exactly like this:
{{
  "relevance_score": [relevance score as integer 0-4],
  "correctness_score": [correctness score as integer 0-4],
  "completeness_score": [completeness score as integer 0-2],
  "score": [total score as integer 0-10],
  "feedback": "[2-sentence feedback string]",
  "strengths": "[strengths string, or empty if score is 0]",
  "weaknesses": "[weaknesses string]",
  "better_answer": "[example of a strong answer]",
  "next_difficulty": "[easier, same, or harder]"
}}

Return ONLY the JSON. No explanation.
"""
    raw = await llm(prompt, task="answer_evaluation", ai_service_url=ai_service_url, groq_api_key=groq_api_key)
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

        # Python-level guardrails: prevent unrelated/meta-test answers from getting high scores
        cleaned_ans = answer.strip().lower()
        if (
            not cleaned_ans 
            or "test the microphone" in cleaned_ans 
            or "testing the microphone" in cleaned_ans 
            or "is it working" in cleaned_ans
            or "microphone working" in cleaned_ans
            or cleaned_ans == "test"
        ):
            relevance = 0
            correctness = 0
            completeness = 0
            score = 0
            parsed["feedback"] = "The candidate did not provide a valid answer to the question (meta-talk/test phrase detected)."
            parsed["strengths"] = ""
            parsed["weaknesses"] = "Unanswered/unrelated audio test phrase."

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


async def generate_report(
    profile: dict,
    all_answers: list[dict],
    ai_service_url: str = None,
    groq_api_key: str = None
) -> dict:
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
    raw = await llm(prompt, task="report", ai_service_url=ai_service_url, groq_api_key=groq_api_key)
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