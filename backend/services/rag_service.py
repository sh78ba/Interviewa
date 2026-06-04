import json

import chromadb
from services.llm_service import embed, llm
from core.config import settings

client = None


def _get_client():
    global client
    if client is not None:
        return client
    try:
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
    except Exception:
        client = None
    return client

async def ingest_resume(interview_id: str, resume_text: str):
    """Chunk resume, embed, store in ChromaDB."""
    chroma_client = _get_client()
    if chroma_client is None:
        return
    chunks = _chunk(resume_text)
    collection = chroma_client.get_or_create_collection(f"interview_{interview_id}")
    for i, chunk in enumerate(chunks):
        embedding = await embed(chunk)
        collection.add(
            ids=[f"chunk_{i}"],
            embeddings=[embedding],
            documents=[chunk]
        )

async def search_resume(interview_id: str, query: str, top_k: int = 3) -> str:
    """Search resume chunks relevant to a query."""
    try:
        chroma_client = _get_client()
        if chroma_client is None:
            return ""
        collection = chroma_client.get_collection(f"interview_{interview_id}")
        query_emb = await embed(query)
        results = collection.query(query_embeddings=[query_emb], n_results=top_k)
        return "\n".join(results["documents"][0])
    except Exception:
        return ""

def _chunk(text: str, size: int = 400, overlap: int = 50) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunk = text[start:start + size].strip()
        if chunk:
            chunks.append(chunk)
        start += size - overlap
    return chunks

async def delete_resume(interview_id: str):
    """Delete ChromaDB collection for this interview."""
    try:
        chroma_client = _get_client()
        if chroma_client is None:
            return
        chroma_client.delete_collection(f"interview_{interview_id}")
    except Exception:
        pass