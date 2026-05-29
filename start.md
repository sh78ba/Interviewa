# Interviewa Start Guide

This file shows how to set up and start the project locally.

For the architecture and request flow, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- A `.env` file at the repo root with the required backend settings

## Required Environment Variables

The backend expects these values from `.env`:

- `ai_service_url`
- `database_url`
- `redis_url`
- `jwt_secret`
- `jwt_expire_minutes`
- `groq_api_key` (optional, but recommended if the primary AI service is unavailable)
- `langfuse_public_key` (optional)
- `langfuse_secret_key` (optional)
- `chroma_host`
- `chroma_port`

## Install Dependencies

### Backend

```bash
cd backend
python3.11 -m pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Start the Project

### 1. Start the backend

From the `backend/` folder:

```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.

### 2. Start the frontend

From the `frontend/` folder:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Main App Flow

1. Open the frontend in the browser.
2. Sign in or register.
3. Create a new interview.
4. Upload a resume if needed.
5. The app fetches the next question from the backend.
6. The interviewer question is spoken aloud through the speech endpoint.
7. Answer by voice or text.
8. The answer is transcribed, evaluated, and feedback is shown.
9. The interview continues until all rounds are complete.

## Helpful Notes

- The backend initializes the database on startup.
- Question generation, evaluation, transcription, and speech synthesis depend on external AI services.
- If ChromaDB is not running, resume retrieval is skipped gracefully.
- The interview page automatically cycles between question, answer, feedback, and the next question.

## Quick Check

If everything is running correctly, these should work:

- `GET /health` on the backend
- Opening the frontend home page in the browser

## Related Files

- [backend/main.py](backend/main.py)
- [backend/api/interview.py](backend/api/interview.py)
- [backend/api/speech.py](backend/api/speech.py)
- [frontend/app/interview/[id]/page.tsx](frontend/app/interview/[id]/page.tsx)
