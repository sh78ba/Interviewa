import httpx
from groq import Groq
from core.config import settings

OLLAMA_MODEL_MAP = {
    "question_generation": "llama3.1:8b",
    "answer_evaluation":   "llama3.1:8b",
    "code_evaluation":     "deepseek-coder:6.7b",
    "resume_analysis":     "llama3.1:8b",
    "hr":                  "llama3.1:8b",
    "report":              "llama3.1:8b",
}

async def llm(prompt: str, task: str = "question_generation") -> str:
    """Call Ollama on Colab. Falls back to Groq if unavailable."""
    model = OLLAMA_MODEL_MAP.get(task, "llama3.1:8b")
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            r = await client.post(
                f"{settings.ai_service_url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                headers={"ngrok-skip-browser-warning": "true"}
            )
            r.raise_for_status()
            return r.json()["response"].strip()
    except Exception as e:
        print(f"Ollama failed ({e}), using Groq fallback")
        client = Groq(api_key=settings.groq_api_key)
        resp = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500
        )
        return resp.choices[0].message.content.strip()


async def embed(text: str) -> list[float]:
    """Get embeddings from nomic-embed-text on Colab."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{settings.ai_service_url}/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": text},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        return r.json()["embedding"]