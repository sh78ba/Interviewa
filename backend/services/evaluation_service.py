import json
from services.llm_service import llm

async def evaluate_answer(
    question: str,
    answer: str,
    topic: str,
    round_name: str,
    level: str,
    what_to_look_for: str = "",
    is_coding: bool = False,
    ai_service_url: str = None,
    groq_api_key: str = None
) -> dict:

    # 1. Programmatic Pre-checks for empty, filler, or skip answers
    cleaned_ans = answer.strip().lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "")
    filler_phrases = {
        "skip", "skipped", "pass", "don't know", "dont know", "i don't know", "i dont know", 
        "no idea", "i have no idea", "no answer", "no answer provided", "test", "testing", 
        "is it working", "testing the microphone", "test the microphone", "microphone working"
    }
    if (
        not cleaned_ans 
        or cleaned_ans in filler_phrases
        or "test the microphone" in cleaned_ans 
        or "testing the microphone" in cleaned_ans 
        or "is it working" in cleaned_ans
        or "microphone working" in cleaned_ans
        or cleaned_ans == "test"
    ):
        return {
            "relevance_score": 0,
            "correctness_score": 0,
            "completeness_score": 0,
            "score": 0,
            "feedback": "The candidate did not provide a valid answer to this question (skipped or test phrase detected).",
            "strengths": "",
            "weaknesses": "Unanswered/skipped question.",
            "better_answer": "Provide a complete response to this question to get feedback.",
            "next_difficulty": "same"
        }

    # Calculate word count for non-coding length-based score caps
    word_count = len(answer.strip().split())
    cap_limit = 10
    if not is_coding:
        if word_count < 5:
            cap_limit = 2
        elif word_count < 15:
            cap_limit = 5

    is_behavioral = (
        round_name.lower() in ["hr", "cultural", "behavioural", "behavioral"]
        or "behavioral" in round_name.lower()
        or "behavioural" in round_name.lower()
        or "cultural" in round_name.lower()
        or "googleyness" in round_name.lower()
        or "leadership" in round_name.lower()
        or round_name.lower().endswith("culture")
        or round_name.lower().endswith("fit")
    )
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
Coding Question: {"Yes" if is_coding else "No"}

CRITICAL RULES:
1. If the candidate's answer is off-topic, completely unrelated to the question, or consists of meta-talk/test phrases, you MUST score it 0.
2. If the candidate simply repeats the question back to you, or asks a question back, or slightly modifies the question without answering it, you MUST score it 0.
3. If the candidate's answer is empty or has only filler words (e.g., "I don't know", "skip", "test"), you MUST score it 0.
4. Do NOT reward buzzwords, vague filler, or unrelated technical topics.
5. If the candidate's answer is technically incorrect, contains major conceptual errors, or shows lack of basic understanding, you MUST score correctness_score as 0 or 1.
6. If the answer is off-topic or doesn't address the specific question asked, relevance_score MUST be 0 or 1.
7. For Coding Questions, evaluate both the code syntax/correctness and the logical approach explained in the answer.

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

        # Guardrail: prevent unrelated answers from getting inflated scores.
        if relevance <= 1:
            score = min(score, 3)
        elif relevance == 2:
            score = min(score, 5)

        # Apply programmatic word-count score caps
        if score > cap_limit:
            score = cap_limit
            if score == 2:
                relevance = min(relevance, 1)
                correctness = min(correctness, 1)
                completeness = 0
            elif score == 5:
                relevance = min(relevance, 2)
                correctness = min(correctness, 2)
                completeness = min(completeness, 1)

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
    # 1. Calculate scores programmatically to guarantee mathematical accuracy
    round_scores = {}
    round_counts = {}
    for a in all_answers:
        r_name = a.get("round", "technical")
        score = float(a.get("score", 0.0) or 0.0)
        round_scores[r_name] = round_scores.get(r_name, 0.0) + score
        round_counts[r_name] = round_counts.get(r_name, 0) + 1

    scores_by_round = {}
    total_score = 0.0
    total_questions = 0
    for r_name, r_score in round_scores.items():
        count = round_counts[r_name]
        percentage = round((r_score / (count * 10.0)) * 100.0, 1)
        scores_by_round[r_name] = percentage
        total_score += r_score
        total_questions += count

    overall_score = 0.0
    if total_questions > 0:
        overall_score = round((total_score / (total_questions * 10.0)) * 100.0, 1)

    # 2. Get qualitative analysis from the LLM
    prompt = f"""
You are a hiring manager reviewing a completed technical interview.

Candidate: {profile.get('candidate_name', 'Unknown')}
Role: {profile.get('role', '')}
Level: {profile.get('level', '')}

Interview answers and scores:
{json.dumps(all_answers[:20], indent=2)}

Calculated Metrics (Do NOT change these):
Overall Score: {overall_score}
Scores by Round: {json.dumps(scores_by_round)}

Generate a final hiring report summarizing their strengths, weaknesses, and a recommendation.
If the overall score is low (e.g. below 50), the recommendation should be 'no' or 'maybe' and the summary should reflect their performance.

Return ONLY valid JSON in this exact structure:
{{
  "strengths": ["list of 2-3 strengths, or warning if score is low"],
  "weaknesses": ["list of weaknesses"],
  "recommendation": "strong_yes|yes|maybe|no",
  "summary": "3-4 sentence overall assessment reflecting their actual performance and scores"
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
        parsed = json.loads(raw.strip())
    except Exception:
        parsed = {}

    # 3. Force mathematical scores into the response
    parsed["scores_by_round"] = scores_by_round
    parsed["overall_score"] = overall_score
    if "strengths" not in parsed or not isinstance(parsed["strengths"], list):
        parsed["strengths"] = ["Terminated early" if overall_score == 0 else "N/A"]
    if "weaknesses" not in parsed or not isinstance(parsed["weaknesses"], list):
        parsed["weaknesses"] = ["Incomplete answers" if overall_score == 0 else "N/A"]
    if "recommendation" not in parsed:
        parsed["recommendation"] = "no" if overall_score < 50 else "maybe"
    if "summary" not in parsed:
        parsed["summary"] = "Interview assessment complete."

    return parsed