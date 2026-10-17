from __future__ import annotations

import logging
import uuid
from typing import Annotated, Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import Settings, get_settings
from .db import HistoryStore, StoreError
from .engine.analyzer import analyze
from .engine.brands import BRANDS
from .engine.rules import RULES
from .models import CLIENT_ID_RE, ScanRequest, ScanResponse

log = logging.getLogger("scamspotter")

app = FastAPI(
    title="Scam Spotter API",
    version="1.0.0",
    description="Paste a suspicious message. Get warning signs, a risk level, a plain-language "
                "explanation and safe next steps. Rules first, AI second.",
)

_origins = [o.strip() for o in get_settings().cors_origins.split(",") if o.strip()] or ["*"]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["*"], allow_headers=["*"])


# ------------------------------------------------------------ error shape
def _err(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.exception_handler(RequestValidationError)
async def _validation(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    if first.get("type") in ("missing", "json_invalid", "model_attributes_type"):
        msg = 'Send a JSON body like {"message": "text or link to scan"}.'
    else:
        msg = str(first.get("msg", "Invalid input.")).removeprefix("Value error, ")
    return _err(422, "invalid_input", msg)


@app.exception_handler(StarletteHTTPException)
async def _http(_: Request, exc: StarletteHTTPException):
    return _err(exc.status_code, "http_error", str(exc.detail))


# ------------------------------------------------------------ helpers
def _store(s: Settings = Depends(get_settings)) -> HistoryStore:
    return HistoryStore(s)


def _client_id(value: Optional[str], required: bool) -> Optional[str]:
    if value is None:
        if required:
            raise HTTPException(400, "Missing X-Client-Id header (a random id your frontend keeps per browser).")
        return None
    if not CLIENT_ID_RE.match(value):
        raise HTTPException(400, "X-Client-Id must be 16-64 characters: letters, digits, '-' or '_'.")
    return value


def _check_uuid(value: str) -> str:
    try:
        return str(uuid.UUID(value))
    except ValueError:
        raise HTTPException(400, "That is not a valid scan id.")


ClientHeader = Annotated[Optional[str], Header(alias="X-Client-Id")]


# ------------------------------------------------------------ routes
@app.get("/")
def root():
    return {"name": "Scam Spotter API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health(s: Settings = Depends(get_settings)):
    return {
        "status": "ok",
        "history": bool(s.supabase_url and s.supabase_service_role_key),
        "ai_explanations": bool(s.gemini_api_key),
        "google_safe_browsing": bool(s.google_safe_browsing_api_key),
        "virustotal": bool(s.virustotal_api_key),
    }


@app.post("/api/scan", response_model=ScanResponse)
async def scan(req: ScanRequest, x_client_id: ClientHeader = None,
               s: Settings = Depends(get_settings), store: HistoryStore = Depends(_store)):
    """Scan a pasted message. Send `X-Client-Id` to also save it to that browser's history."""
    cid = _client_id(x_client_id, required=False)
    async with httpx.AsyncClient() as http:
        result = await analyze(req.message, s, http)
    if cid and store.enabled:
        try:
            await store.save(cid, result)
            result.saved = True
        except StoreError as e:
            log.warning("Could not save scan: %s", e)
    return result


@app.get("/api/rules")
def rules(s: Settings = Depends(get_settings)):
    """Every rule and its points, so the scoring is visible and explainable."""
    return {
        "thresholds": {"safe": [0, s.safe_max], "suspicious": [s.safe_max + 1, s.suspicious_max],
                       "high_risk": [s.suspicious_max + 1, 100]},
        "max_score": 100,
        "how_it_works": "Each rule that matches adds its points once. Points are added up and capped at 100.",
        "rules": [{"id": r.id, "label": r.label, "category": r.category, "points": r.points,
                   "severity": r.severity, "why": r.why} for r in RULES.values()],
        "brands_checked": [{"name": b.name, "kind": b.kind, "official_domains": list(b.domains)}
                           for b in BRANDS],
    }


@app.get("/api/history")
async def history(x_client_id: ClientHeader = None, limit: int = Query(20, ge=1, le=100),
                  offset: int = Query(0, ge=0), store: HistoryStore = Depends(_store)):
    cid = _client_id(x_client_id, required=True)
    try:
        return {"items": await store.list(cid, limit, offset), "limit": limit, "offset": offset}
    except StoreError as e:
        raise HTTPException(503, str(e))


@app.get("/api/history/{scan_id}", response_model=ScanResponse)
async def history_item(scan_id: str, x_client_id: ClientHeader = None, store: HistoryStore = Depends(_store)):
    cid = _client_id(x_client_id, required=True)
    try:
        row = await store.get(cid, _check_uuid(scan_id))
    except StoreError as e:
        raise HTTPException(503, str(e))
    if not row:
        raise HTTPException(404, "Scan not found.")
    return {**row, "saved": True}


@app.delete("/api/history/{scan_id}")
async def delete_item(scan_id: str, x_client_id: ClientHeader = None, store: HistoryStore = Depends(_store)):
    cid = _client_id(x_client_id, required=True)
    try:
        n = await store.delete(cid, _check_uuid(scan_id))
    except StoreError as e:
        raise HTTPException(503, str(e))
    if not n:
        raise HTTPException(404, "Scan not found.")
    return {"deleted": n}


@app.delete("/api/history")
async def delete_all(x_client_id: ClientHeader = None, store: HistoryStore = Depends(_store)):
    cid = _client_id(x_client_id, required=True)
    try:
        return {"deleted": await store.delete_all(cid)}
    except StoreError as e:
        raise HTTPException(503, str(e))
