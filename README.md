# Fraudora

<p align="center">
  <strong>Understand suspicious messages before you act.</strong><br />
  Fraudora analyzes SMS and message text, explains warning signs, and offers safer next steps.
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white" />
  <img alt="License not specified" src="https://img.shields.io/badge/license-not%20specified-lightgrey.svg" />
</p>

## Overview

Fraudora is a full-stack scam-message analysis application. Its React frontend provides a workspace for scanning suspicious messages and reviewing results. The FastAPI backend applies explainable rules and link analysis, then returns a risk score, findings, and practical guidance. Optional integrations can add AI explanations, URL reputation checks, and persistent scan history.

The rules engine determines the score. Optional AI generates explanations and does not change the score. External integrations are configured on the backend and are not required for basic scanning.

## Key features

- Scan pasted message text and review a risk score with matched indicators.
- Highlight suspicious message segments and explain why each finding matters.
- Inspect links and show reputation caveats without treating an unverified domain as automatically malicious.
- Provide practical next steps and fraud-reporting guidance.
- View available scoring rules and thresholds.
- Browse recent scans; history can use local browser storage or optional Supabase persistence.
- Optionally enrich results with Gemini explanations, Google Safe Browsing, and VirusTotal.
- Keep the interface responsive and present submitted URLs as non-clickable text.

## Risk levels

| Signal | Score | Color | Meaning |
|---|---:|---|---|
| 🟢 **Safe** | 0–29 | Green | No strong scam indicators were found. Stay cautious with unexpected messages. |
| 🟡 **Suspicious** | 30–59 | Amber | Warning signs are present. Verify the sender through a trusted channel. |
| 🔴 **High Risk** | 60–100 | Red | Multiple or serious indicators suggest a likely scam. Do not respond or follow the message's instructions. |

Scores are capped at 100. The backend's rules and thresholds are available from `GET /api/rules`.

## Tech stack

### Frontend

| Technology | Role |
|---|---|
| React 19 | User interface |
| Vite | Development server and production build |
| Tailwind CSS | Utility-first styling |
| Lucide React | Icons |
| Oxlint | Linting |

### Backend

| Technology | Role |
|---|---|
| Python 3.13+ | Backend runtime |
| FastAPI | REST API and OpenAPI documentation |
| Pydantic Settings | Typed configuration from environment variables |
| HTTPX | Async HTTP requests for optional integrations |
| pytest | Backend tests |
| Supabase (optional) | Persisted scan history and dynamic rule data |
| Gemini, Google Safe Browsing, VirusTotal (optional) | Explanation and link-reputation integrations |

## Project structure

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/                         # Static assets served by Vite
├── src/                            # React frontend
│   ├── App.jsx                     # App state and scan/view flow
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── assets/
│   ├── components/                # Workspace, dashboard, modals, and UI
│   ├── data/                      # Display data and sample messages
│   ├── hooks/
│   └── services/
│       └── api.js                 # Backend API client and local history fallback
└── scam-spotter-api/              # FastAPI backend
    ├── api/
    │   └── index.py               # Vercel entry point
    ├── app/
    │   ├── main.py                # FastAPI routes
    │   ├── config.py              # Environment-backed settings
    │   ├── db.py                  # Optional history persistence
    │   ├── models.py              # Request and response models
    │   └── engine/                # Scoring, link analysis, and explanations
    ├── tests/                     # Backend test suite
    ├── .env.example               # Backend configuration template
    ├── pyproject.toml
    ├── requirements.txt
    └── supabase_schema.sql
```

## Local setup

You will need Node.js and npm for the frontend, and Python 3.13 or newer for the backend. Start the API and frontend in separate terminals.

### 1. Start the backend

From the repository root:

```powershell
cd scam-spotter-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`.

On macOS/Linux, use these activation and environment-file commands instead:

```bash
source .venv/bin/activate
cp .env.example .env
```

The integrations are optional; leave their settings empty to run the rules-based scanner without them. Configure `CORS_ORIGINS` if the frontend is served from an origin other than the local Vite setup.

### 2. Start the frontend

In a second terminal, from the repository root:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Vite proxies `/api` and `/health` requests to `http://localhost:8000`. To use a different API host, set `VITE_API_BASE_URL` in a root `.env` file.

### Other frontend commands

```bash
npm run lint
npm run build
npm run preview
```

### Run backend tests

From `scam-spotter-api/` with the virtual environment active:

```bash
pytest
```

## API overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan` | Analyze a message. Send `X-Client-Id` to save it to configured history. |
| `GET` | `/api/rules` | Return active scoring rules, thresholds, and brand data. |
| `GET` | `/api/history` | List scans for the supplied client ID. |
| `GET` | `/api/history/{id}` | Retrieve a saved scan. |
| `DELETE` | `/api/history/{id}` | Delete one saved scan. |
| `DELETE` | `/api/history` | Delete all saved scans for the client. |
| `GET` | `/health` | Report API and optional integration status. |

The API does not require a client ID to scan a message. A client ID is required for history operations. See the backend's interactive `/docs` page for request and response schemas.

## Privacy and safety

- Do not send real passwords, PINs, OTPs, or other sensitive personal information when testing.
- Supabase, Gemini, Google Safe Browsing, and VirusTotal require backend configuration. Review their data handling policies before enabling them; message text or links may be sent to the configured external service.
- Keep service-role keys and API keys on the backend. Never expose them in frontend environment variables or commit them to source control.
- A scan is guidance, not a guarantee. Verify account or payment issues by contacting the organization through a trusted number or website.

## Team

**Core2Duo**

| Team member | Role |
|---|---|
| Kaustav Paul | Frontend Lead |
| Shreyansh Tiwari | Backend Lead |
