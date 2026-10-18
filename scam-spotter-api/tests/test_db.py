import asyncio
import json

import httpx
import pytest

from app.config import Settings
from app.db import HistoryStore, StoreError
from tests.test_engine import PDF_SAMPLE, run


@pytest.fixture
def calls(monkeypatch):
    log = []

    def handler(req: httpx.Request):
        log.append(req)
        if req.method == "GET" and "select=result" in str(req.url):
            return httpx.Response(200, json=[{"result": {"ok": True}}])
        if req.method == "DELETE":
            return httpx.Response(200, json=[{"id": "x"}])
        return httpx.Response(200 if req.method == "GET" else 201, json=[])

    real = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: real(**{**kw, "transport": kw.get("transport") or httpx.MockTransport(handler)}))
    return log


def store(key="sb_secret_abc", keep=True):
    return HistoryStore(Settings(_env_file=None, supabase_url="https://p.supabase.co/",
                                 supabase_service_role_key=key, store_message_text=keep))


def test_save_posts_row_with_full_result(calls):
    res = run(PDF_SAMPLE)
    asyncio.run(store().save("c" * 20, res))
    req = calls[0]
    assert req.method == "POST" and str(req.url) == "https://p.supabase.co/rest/v1/scans"
    row = json.loads(req.content)
    assert row["client_id"] == "c" * 20 and row["score"] == 100 and row["level"] == "high_risk"
    assert "otp_request" in row["rule_ids"] and row["result"]["message"] == res.message
    assert req.headers["apikey"] == "sb_secret_abc" and "authorization" not in req.headers


def test_legacy_jwt_key_also_sent_as_bearer(calls):
    asyncio.run(store(key="eyJhbGciOi.x.y").save("c" * 20, run("hello")))
    assert calls[0].headers["authorization"] == "Bearer eyJhbGciOi.x.y"


def test_redaction_when_message_text_is_off(calls):
    asyncio.run(store(keep=False).save("c" * 20, run(PDF_SAMPLE)))
    row = json.loads(calls[0].content)
    assert row["preview"] is None and row["result"]["message"] == ""
    assert all(f["matches"] == [] for f in row["result"]["findings"])
    assert PDF_SAMPLE[:30] not in json.dumps(row)
    assert all("/" not in l["url"] for l in row["result"]["links"])


def test_queries_are_scoped_to_client(calls):
    s = store()
    asyncio.run(s.list("c" * 20, 10, 5))
    p = calls[0].url.params
    assert p["client_id"] == "eq." + "c" * 20 and p["order"] == "created_at.desc"
    assert p["limit"] == "10" and p["offset"] == "5"
    assert asyncio.run(s.get("c" * 20, "11111111-1111-1111-1111-111111111111")) == {"ok": True}
    assert asyncio.run(s.delete("c" * 20, "11111111-1111-1111-1111-111111111111")) == 1
    assert "client_id" in calls[-1].url.params


def test_not_configured_raises():
    s = HistoryStore(Settings(_env_file=None))
    with pytest.raises(StoreError):
        asyncio.run(s.list("c" * 20, 1, 0))


# ---------------------------------------------------------------- dynamic config loader
from app.engine import dynamic
from app.engine.analyzer import analyze
from app.engine.text import sanitize


def _dyn_settings():
    return Settings(_env_file=None, supabase_url="https://p.supabase.co/",
                    supabase_service_role_key="sb_secret_abc", config_cache_ttl_s=0)


def _dyn_handler():
    def handler(req: httpx.Request):
        url = str(req.url)
        if "scam_rules" in url:
            return httpx.Response(200, json=[
                {"id": "otp_request", "label": "OTP request", "points": 10, "kind": "code", "enabled": True},
                {"id": "shortened_url", "label": "Short link", "points": 15, "kind": "code", "enabled": False},
                {"id": "kw_brand", "label": "Scam brand", "category": "bait", "group_name": "lure",
                 "sub": "brand", "points": 30, "kind": "keyword", "enabled": True, "word_boundary": True,
                 "why": "Seen in scams.", "advice": "Ignore."},
            ])
        if "scam_rule_keywords" in url:
            return httpx.Response(200, json=[{"rule_id": "kw_brand", "phrase": "tradeplus"}])
        if "known_scams" in url:
            return httpx.Response(200, json=[
                {"id": "11111111-1111-1111-1111-111111111111", "label": "fake credit",
                 "raw_text": "received Rs.3875 Balance Rs.5323 Check account details bit.ly/4hUMrQA", "enabled": True}])
        return httpx.Response(404, json=[])
    return handler


def _patched(monkeypatch, handler):
    real = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient",
                        lambda **kw: real(**{**kw, "transport": kw.get("transport") or httpx.MockTransport(handler)}))


def test_loader_builds_overrides_keyword_rules_and_library(monkeypatch):
    dynamic.clear_cache()
    _patched(monkeypatch, _dyn_handler())

    async def go():
        async with httpx.AsyncClient() as http:
            return await dynamic.load(_dyn_settings(), http)
    cfg = asyncio.run(go())
    assert cfg.overrides["otp_request"].points == 10
    assert "shortened_url" in cfg.disabled
    assert len(cfg.keyword_rules) == 1 and cfg.keyword_rules[0].phrases == ("tradeplus",)
    assert len(cfg.known) == 1 and cfg.known[0].label == "fake credit"


def test_analyze_uses_loaded_config_end_to_end(monkeypatch):
    dynamic.clear_cache()
    _patched(monkeypatch, _dyn_handler())
    s = _dyn_settings()

    async def go(msg):
        async with httpx.AsyncClient() as http:
            return await analyze(sanitize(msg), s, http)
    r = asyncio.run(go("Please share the OTP from TradePlus"))
    pts = {f.rule_id: f.points for f in r.findings}
    assert pts["otp_request"] == 10            # override applied
    assert pts["kw_brand"] == 30               # db keyword rule fired
    dynamic.clear_cache()


def test_loader_fails_open_on_db_error(monkeypatch):
    dynamic.clear_cache()
    _patched(monkeypatch, lambda req: httpx.Response(500, json={}))

    async def go():
        async with httpx.AsyncClient() as http:
            return await dynamic.load(_dyn_settings(), http)
    cfg = asyncio.run(go())
    assert cfg is dynamic.EMPTY
    dynamic.clear_cache()
