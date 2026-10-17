import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import _store, app
from tests.test_engine import PDF_SAMPLE

CID = "abcdef0123456789abcdef"


class FakeStore:
    enabled = True

    def __init__(self):
        self.rows = {}

    async def save(self, cid, res):
        self.rows[res.id] = (cid, res.model_dump(mode="json"))

    async def list(self, cid, limit, offset):
        rows = [{"id": i, "score": d["score"], "level": d["level"], "preview": d["message"][:80]}
                for i, (c, d) in self.rows.items() if c == cid]
        return rows[offset:offset + limit]

    async def get(self, cid, sid):
        c, d = self.rows.get(sid, (None, None))
        return d if c == cid else None

    async def delete(self, cid, sid):
        return 1 if self.rows.pop(sid, None) else 0

    async def delete_all(self, cid):
        n = len(self.rows)
        self.rows.clear()
        return n


@pytest.fixture
def client():
    store = FakeStore()
    app.dependency_overrides[_store] = lambda: store
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health_and_rules(client):
    assert client.get("/health").json()["status"] == "ok"
    body = client.get("/api/rules").json()
    assert body["thresholds"]["high_risk"] == [60, 100]
    assert {r["id"]: r["points"] for r in body["rules"]}["otp_request"] == 40


def test_scan_without_client_id_works_and_is_not_saved(client):
    r = client.post("/api/scan", json={"message": PDF_SAMPLE})
    assert r.status_code == 200 and r.json()["score"] == 100 and r.json()["saved"] is False


def test_scan_empty_and_bad_input_have_friendly_errors(client):
    r = client.post("/api/scan", json={"message": "   "})
    assert r.status_code == 422 and r.json()["error"]["message"] == "Please paste a message or link to scan."
    assert client.post("/api/scan", json={}).json()["error"]["code"] == "invalid_input"
    assert "too long" in client.post("/api/scan", json={"message": "a" * 6000}).json()["error"]["message"]
    assert client.post("/api/scan", content="not json",
                       headers={"content-type": "application/json"}).status_code == 422


def test_history_flow_is_private_per_client(client):
    h = {"X-Client-Id": CID}
    sid = client.post("/api/scan", json={"message": PDF_SAMPLE}, headers=h).json()["id"]
    items = client.get("/api/history", headers=h).json()["items"]
    assert [i["id"] for i in items] == [sid]
    assert client.get(f"/api/history/{sid}", headers=h).json()["level"] == "high_risk"
    other = {"X-Client-Id": "zzzzzzzzzzzzzzzzzzzzzz"}
    assert client.get("/api/history", headers=other).json()["items"] == []
    assert client.get(f"/api/history/{sid}", headers=other).status_code == 404
    assert client.delete(f"/api/history/{sid}", headers=h).json() == {"deleted": 1}
    assert client.get(f"/api/history/{sid}", headers=h).status_code == 404


def test_history_header_validation(client):
    assert client.get("/api/history").status_code == 400
    assert client.get("/api/history", headers={"X-Client-Id": "short"}).status_code == 400
    assert client.get("/api/history/not-a-uuid", headers={"X-Client-Id": CID}).status_code == 400
    assert client.get(f"/api/history/{uuid.uuid4()}", headers={"X-Client-Id": CID}).status_code == 404


def test_history_not_configured_returns_503():
    app.dependency_overrides.clear()
    c = TestClient(app)
    r = c.get("/api/history", headers={"X-Client-Id": CID})
    assert r.status_code == 503 and "not configured" in r.json()["error"]["message"]
    assert c.post("/api/scan", json={"message": "hi"}, headers={"X-Client-Id": CID}).json()["saved"] is False
