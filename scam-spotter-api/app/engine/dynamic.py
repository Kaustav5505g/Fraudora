"""Load the tunable parts of the engine from Supabase: rule points/toggles, extra
keyword rules, and the known-scam library. Cached with a short TTL so edits in the
Supabase table editor go live within a minute, with no redeploy.

If Supabase is not configured (or the fetch fails), the engine falls back to the
code defaults, so local runs and tests need no database.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

import httpx

from ..config import Settings
from .matcher import KnownScam, prepare

log = logging.getLogger("scamspotter.dynamic")


@dataclass(frozen=True)
class KeywordRule:
    id: str
    label: str
    category: str
    group: str
    sub: str
    points: int
    why: str
    advice: str
    phrases: tuple[str, ...]
    word_boundary: bool = True


@dataclass(frozen=True)
class Override:
    points: int | None = None
    label: str | None = None
    category: str | None = None
    group: str | None = None
    sub: str | None = None
    why: str | None = None
    advice: str | None = None


@dataclass(frozen=True)
class DynamicConfig:
    overrides: dict[str, Override] = field(default_factory=dict)
    disabled: frozenset[str] = frozenset()
    keyword_rules: tuple[KeywordRule, ...] = ()
    known: tuple[KnownScam, ...] = ()


EMPTY = DynamicConfig()
_cache: dict = {"at": 0.0, "cfg": None}


def _headers(s: Settings) -> dict[str, str]:
    key = s.supabase_service_role_key
    h = {"apikey": key}
    if key.startswith("eyJ"):
        h["Authorization"] = f"Bearer {key}"
    return h


async def _get(http: httpx.AsyncClient, s: Settings, table: str, params: dict) -> list[dict]:
    url = s.supabase_url.rstrip("/") + f"/rest/v1/{table}"
    r = await http.get(url, params=params, headers=_headers(s), timeout=s.external_timeout_s)
    r.raise_for_status()
    return r.json()


async def _fetch(http: httpx.AsyncClient, s: Settings) -> DynamicConfig:
    rules = await _get(http, s, "scam_rules", {"select": "*"})
    kw_rows = await _get(http, s, "scam_rule_keywords", {"select": "rule_id,phrase"})
    scams = await _get(http, s, "known_scams", {"select": "id,label,raw_text,enabled"})

    phrases: dict[str, list[str]] = {}
    for row in kw_rows:
        phrases.setdefault(row["rule_id"], []).append(row["phrase"])

    overrides: dict[str, Override] = {}
    disabled: set[str] = set()
    keyword_rules: list[KeywordRule] = []
    for r in rules:
        rid = r["id"]
        if not r.get("enabled", True):
            disabled.add(rid)
        if (r.get("kind") or "code") == "keyword":
            if r.get("enabled", True):
                keyword_rules.append(KeywordRule(
                    id=rid, label=r["label"], category=r.get("category", "bait"),
                    group=r.get("group_name", "lure"), sub=r.get("sub", ""),
                    points=int(r["points"]), why=r.get("why", ""), advice=r.get("advice", ""),
                    phrases=tuple(phrases.get(rid, [])),
                    word_boundary=bool(r.get("word_boundary", True))))
        else:
            overrides[rid] = Override(
                points=int(r["points"]) if r.get("points") is not None else None,
                label=r.get("label"), category=r.get("category"), group=r.get("group_name"),
                sub=r.get("sub"), why=r.get("why"), advice=r.get("advice"))

    known = tuple(prepare(str(x["id"]), x.get("label", "known scam"), x["raw_text"])
                  for x in scams if x.get("enabled", True) and x.get("raw_text"))
    return DynamicConfig(overrides=overrides, disabled=frozenset(disabled),
                         keyword_rules=tuple(keyword_rules), known=known)


async def load(s: Settings, http: httpx.AsyncClient) -> DynamicConfig:
    if not (s.dynamic_rules_enabled and s.supabase_url and s.supabase_service_role_key):
        return EMPTY
    now = time.monotonic()
    if _cache["cfg"] is not None and now - _cache["at"] < s.config_cache_ttl_s:
        return _cache["cfg"]
    try:
        cfg = await _fetch(http, s)
        _cache.update(at=now, cfg=cfg)
        return cfg
    except Exception as e:  # noqa: BLE001  (fail-open: never block a scan on config load)
        log.warning("Dynamic config load failed, using %s: %s",
                    "last cached" if _cache["cfg"] else "code defaults", e)
        return _cache["cfg"] or EMPTY


def clear_cache() -> None:
    _cache.update(at=0.0, cfg=None)
