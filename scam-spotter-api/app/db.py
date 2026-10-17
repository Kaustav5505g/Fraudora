"""Scan history in Supabase, via its PostgREST API (no extra client library needed)."""
from __future__ import annotations

import logging
from urllib.parse import quote

import httpx

from .config import Settings
from .models import ScanResponse

log = logging.getLogger("scamspotter.db")


class StoreError(Exception):
    pass


class HistoryStore:
    def __init__(self, s: Settings):
        self.s = s
        self.base = s.supabase_url.rstrip("/") + "/rest/v1/scans"

    @property
    def enabled(self) -> bool:
        return bool(self.s.supabase_url and self.s.supabase_service_role_key)

    def _headers(self, **extra: str) -> dict[str, str]:
        key = self.s.supabase_service_role_key
        h = {"apikey": key, "Content-Type": "application/json", **extra}
        if key.startswith("eyJ"):          # legacy JWT-style key; new sb_secret_ keys use apikey only
            h["Authorization"] = f"Bearer {key}"
        return h

    async def _call(self, method: str, params: dict | None = None, json=None, prefer: str | None = None):
        if not self.enabled:
            raise StoreError("History is not configured on this server.")
        headers = self._headers(**({"Prefer": prefer} if prefer else {}))
        try:
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.request(method, self.base, params=params, json=json, headers=headers)
        except httpx.HTTPError as e:
            raise StoreError(f"Could not reach the database: {e}") from e
        if r.status_code >= 300:
            raise StoreError(f"Database error {r.status_code}: {r.text[:200]}")
        return r

    @staticmethod
    def _redact(result: dict) -> dict:
        """STORE_MESSAGE_TEXT=false: keep scores and rule ids only."""
        result = dict(result)
        result["message"] = ""
        result["segments"] = []
        result["findings"] = [{**f, "matches": [], "details": []} for f in result["findings"]]
        result["links"] = [{**l, "url": l["host"], "span": {"start": 0, "end": 0, "text": ""},
                            "reasons": []} for l in result["links"]]
        result["ai_summary"] = None
        return result

    async def save(self, client_id: str, res: ScanResponse) -> None:
        keep = self.s.store_message_text
        data = res.model_dump(mode="json")
        row = {
            "id": res.id, "client_id": client_id, "score": res.score, "level": res.level,
            "preview": (res.message[:80] if keep else None),
            "rule_ids": [f.rule_id for f in res.findings],
            "result": data if keep else self._redact(data),
        }
        await self._call("POST", json=row, prefer="return=minimal")

    async def list(self, client_id: str, limit: int, offset: int) -> list[dict]:
        r = await self._call("GET", params={
            "client_id": f"eq.{client_id}", "select": "id,created_at,score,level,preview,rule_ids",
            "order": "created_at.desc", "limit": str(limit), "offset": str(offset)})
        return r.json()

    async def get(self, client_id: str, scan_id: str) -> dict | None:
        r = await self._call("GET", params={
            "client_id": f"eq.{client_id}", "id": f"eq.{quote(scan_id)}", "select": "result"})
        rows = r.json()
        return rows[0]["result"] if rows else None

    async def delete(self, client_id: str, scan_id: str) -> int:
        r = await self._call("DELETE", params={
            "client_id": f"eq.{client_id}", "id": f"eq.{quote(scan_id)}", "select": "id"},
            prefer="return=representation")
        return len(r.json())

    async def delete_all(self, client_id: str) -> int:
        r = await self._call("DELETE", params={"client_id": f"eq.{client_id}", "select": "id"},
                             prefer="return=representation")
        return len(r.json())
