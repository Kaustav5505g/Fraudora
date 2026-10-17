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
