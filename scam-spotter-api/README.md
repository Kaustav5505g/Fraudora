# Scam Spotter API (SETU 2026 · PS-01)

Paste a suspicious message → get **warning signs, a risk level, a plain-language explanation and safe next steps**.
Rules decide the score. AI only explains.

```
message ─► sanitize ─► Layer 1: rules + link analysis ─► (optional) Safe Browsing / VirusTotal
                                  │
                                  ▼
                  visible points, capped at 100 ─► Safe / Suspicious / High Risk
                                  │
                                  ▼ only if score ≥ 30
                      Layer 2: Gemini writes a short explanation (never changes the score)
```

## Scoring (all visible at `GET /api/rules`)

Each rule that matches adds its points **once**. Total is capped at 100.

| Rule | Points | Catches |
|---|---|---|
| OTP request | 40 | "share the OTP", "send the verification code" |
| Password / PIN / card request | 40 | password, PIN, CVV, card number, UPI PIN, Aadhaar/PAN number |
| Link reported as dangerous | 40 | Google Safe Browsing / VirusTotal flagged (only if API keys set) |
| Suspicious link | 25 | lookalike of a bank/college/courier, raw IP, `@` trick, look-alike characters, `kyc-verify-now.com` style |
| Prize or lottery bait | 25 | "you have won", lottery, "claim your refund" |
| Request to pay a fee | 25 | "processing/customs/redelivery fee", "pay ₹25 to reschedule" |
| Fake urgency | 20 | today, immediately, within 24 hours, final notice |
| Legal threat | 20 | arrest warrant, legal action, FIR, money laundering |
| Account threat | 15 | "account will be blocked", "KYC is incomplete" |
| Shortened link | 15 | bit.ly, tinyurl, cutt.ly … |
| Delivery problem pretext | 10 | "parcel on hold", "address incomplete" |

**Bands:** Safe 0–29 · Suspicious 30–59 · High Risk 60–100 (from the PDF; change `SAFE_MAX` / `SUSPICIOUS_MAX` in env).

**False-alarm protection**
- "Never share your OTP", "Do not share it with anyone" is a *warning*, not a request → no points, and the response says why it looks genuine.
  A request that merely follows a "do not" ("Do not ignore this; share the OTP") is still caught.
- Official domains (`sbi.co.in`, `amazon.in`, `manipal.edu` …) are never flagged. `sbi.co.in.evil.com` and `sbi.co.in@evil.com` are.
- A normal link to an unknown site is not penalised; it just produces a caveat ("could not verify").
- No single weak rule can reach High: urgency 20 + threat 15 = 35 → Suspicious at most.

The PDF example scores **100/100 High Risk** (urgency 20 + account threat 15 + suspicious link 25 + OTP request 40).
Brands and official domains live in `app/engine/brands.py`. Check them before the demo.

## Endpoints

Interactive docs: `/docs`. Errors always look like `{"error": {"code": "...", "message": "..."}}`.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/scan` | Body `{"message": "..."}`. Add header `X-Client-Id` to also save to that user's history. |
| `GET` | `/api/rules` | All rules, points, thresholds, brands checked. |
| `GET` | `/api/history?limit=20&offset=0` | Needs `X-Client-Id`. |
| `GET` | `/api/history/{id}` | Full original result (re-open with highlights). |
| `DELETE` | `/api/history/{id}` · `/api/history` | Delete one / all of that user's scans. |
| `GET` | `/health` | Which optional services are configured. |

```bash
curl -X POST $API/api/scan -H 'content-type: application/json' -H 'X-Client-Id: 3f2b8c1e-aaaa-bbbb-cccc-1234567890ab' \
  -d '{"message":"SBI ALERT: Your KYC is incomplete and your account will be blocked today. Update immediately at http://sbi-kyc-update.example/verify and share the OTP you receive to confirm."}'
```

Key response fields: `score`, `level` (`safe|suspicious|high_risk`), `label` ("High Risk"), `headline` ("Likely fraud: do not respond"),
`findings[]` (label, points, why, advice, matches), `segments[]`, `links[]`, `summary`, `ai_summary` (nullable), `next_steps[]`, `caveats[]`, `reassurances[]`, `report` (cybercrime.gov.in, 1930), `saved`.

### Notes for the frontend
- **Highlighting:** render `segments` in order. Each has `text` and `rules` (rule ids). Empty `rules` = plain text. No offset maths needed.
  Colour by the finding's `category` or `severity`. The response's `message` is the *sanitised* text, so show that one.
- **Traffic light:** `safe` → green, `suspicious` → amber, `high_risk` → crimson.
- **No login:** on first visit create `crypto.randomUUID()`, keep it in `localStorage`, and send it as `X-Client-Id`.
  Without the header, scans still work but are not saved.

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env        # fill in what you have; everything is optional
uvicorn app.main:app --reload
pytest                      # 42 tests
```
With an empty `.env` the rules engine works fully. History, Gemini and link reputation switch on when their keys are present.

## Supabase

1. Create a project → **SQL Editor** → run `supabase_schema.sql`.
2. Settings → API: copy the project URL and the **secret / service_role** key into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
   This key stays on the server only. The table has RLS on with no policies, so the public key can't read it.
3. `STORE_MESSAGE_TEXT=false` stores only score, level and rule ids (no message text or full URLs).

History is keyed by the anonymous `X-Client-Id`. It is private per browser but not a login. Anyone who knows the id can read that history.
To move to real accounts later, swap the id for the Supabase Auth user id.

## Deploy to Vercel

1. Push this folder to GitHub → Vercel → **Add New Project** → import it (framework preset: Other).
2. Settings → Environment Variables: add the keys from `.env.example` (set `CORS_ORIGINS` to your frontend URL).
3. Deploy, then open `https://<your-app>.vercel.app/health` and `/docs`.

`api/index.py` + `vercel.json` route every path to the FastAPI app. If Vercel complains about `vercel.json`, delete it. Vercel then auto-detects `app/main.py`.

## Not included (by design)
Login / OTP sign-up, billing and API keys for customers, rate limiting. Gemini, Safe Browsing and VirusTotal send the message text or links to those services, so mention that in your privacy note. VirusTotal's free tier allows about 4 lookups a minute.
