import json
import fitz
from services.llm_service import llm

def parse_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()

async def extract_profile(resume_text: str, role: str, level: str, ai_service_url: str = None, groq_api_key: str = None) -> dict:
    prompt = f"""
You are an expert technical recruiter.

Analyze this resume for a {level} {role} engineering role.

RESUME:
{resume_text[:3000]}

Return ONLY valid JSON:
{{
  "candidate_name": "full name",
  "skills": ["skill1", "skill2"],
  "tech_stack": ["tech1", "tech2"],
  "projects": [
    {{
      "name": "project name",
      "description": "one line description",
      "tech_used": ["tech1"],
      "interesting_aspects": "what stands out"
    }}
  ],
  "experience_years": 2,
  "education": "degree and college",
  "strengths": ["strength1"],
  "interesting_resume_points": ["specific thing worth asking about"]
}}

Return ONLY the JSON. No explanation.
"""
    raw = await llm(prompt, task="resume_analysis", ai_service_url=ai_service_url, groq_api_key=groq_api_key)
    raw = raw.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except Exception:
        return {
            "candidate_name": "Unknown",
            "skills": [],
            "tech_stack": [],
            "projects": [],
            "experience_years": 0,
            "education": "",
            "strengths": [],
            "interesting_resume_points": []
        }