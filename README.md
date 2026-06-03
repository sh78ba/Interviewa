<div align="center">

<img src="frontend/app/icon.svg" alt="Interviewa logo" width="88" height="88" />

# Interviewa

### Build Your Own AI Interview Practice Platform

Open-source full-stack interview simulation with voice, coding rounds, resume-aware questioning, and AI-generated final reports.

![Status](https://img.shields.io/badge/Status-Pre--Alpha-orange)
![CI](https://img.shields.io/badge/CI-Not%20Configured-lightgrey)
![License](https://img.shields.io/badge/License-AGPLv3-blue)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20Next.js-111827)

<div style="margin: 16px 0;">
  <a href="http://localhost:3000/setup" target="_blank">
    <img src="https://img.shields.io/badge/Interactive%20Setup%20Guide-Open%20Local%20App-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Setup Guide Button" />
  </a>
</div>

[Quickstart](#quickstart) • [Features](#features) • [Project-Structure](#project-structure) • [Contributing](#contributing) • [Community](#community)

</div>

---

## Why Interviewa

Interviewa helps candidates and teams run realistic interview simulations on their own infrastructure.

- Run structured interview sessions end-to-end.
- Generate targeted questions and evaluate responses.
- Support voice-based interaction and coding rounds.
- Produce final reports with actionable feedback.
- Keep full control with self-hosting.

## Features

- AI-powered question generation and answer evaluation
- Resume-aware retrieval pipeline (with optional ChromaDB)
- Voice flow (speech generation + transcription)
- Coding and non-coding round support
- Local single-user interview dashboard
- Paginated interview history and deletion
- Final performance report with scoring insights

## Quickstart

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- `backend/.env` file (copy from `backend/.env.example`)

### 1. Backend

```bash
cd backend
python3.11 -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend URL: `http://127.0.0.1:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`

### Optional: Colab AI Service

Use `Inverviewa.ipynb` in Google Colab (T4 recommended). After execution, copy the generated `AI_SERVICE_URL` into `backend/.env`.

## Project Structure

```text
.
|- backend/                 # FastAPI app, models, services, APIs
|- frontend/                # Next.js app router frontend
|- uploads/                 # Runtime uploads
|- Inverviewa.ipynb         # Colab setup for AI service proxy
|- start.md                 # Detailed local setup guide
|- CONTRIBUTING.md          # Contribution workflow
|- CLA.md                   # Contributor License Agreement (draft)
`- LICENSE                  # Project license
```

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic Settings, Redis
- Frontend: Next.js (App Router), React, TypeScript
- AI/ML: LLM service integration, Whisper pipeline, optional ChromaDB
- Infra: Self-host friendly architecture with Colab-assisted AI proxy option

## Security and Licensing

- License: GNU Affero General Public License v3.0 or later (`LICENSE`)
- CLA policy: `CLA.md`
- If modified versions are provided over a network, AGPL source-sharing obligations apply.

## Contributing

See `CONTRIBUTING.md` for contribution workflow and guidelines.
