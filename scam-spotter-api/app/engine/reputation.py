"""Optional link reputation via Google Safe Browsing and/or VirusTotal.
Fails open: a timeout or error never breaks a scan, the link is just 'unchecked'."""
from __future__ import annotations

import asyncio
import base64
import logging

import httpx

from ..config import Settings

log = logging.getLogger("scamspotter.reputation")

GSB_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
VT_URL = "https://www.virustotal.com/api/v3/urls/"


async def _gsb(http: httpx.AsyncClient, s: Settings, urls: list[str], out: dict) -> None:
    body = {
        "client": {"clientId": "scam-spotter", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
                            "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": u} for u in urls],
        },
    }
    try:
        r = await http.post(GSB_URL, params={"key": s.google_safe_browsing_api_key},
                            json=body, timeout=s.external_timeout_s)
        r.raise_for_status()
        matches = r.json().get("matches", [])
        bad = {m.get("threat", {}).get("url"): m.get("threatType", "") for m in matches}
        for u in urls:
            if u in bad or (matches and len(urls) == 1):
                out[u]["google_safe_browsing"] = "flagged"
                kind = bad.get(u) or matches[0].get("threatType", "")
                out[u].setdefault("detail", []).append(f"Google Safe Browsing: {kind.lower().replace('_', ' ')}")
            else:
                out[u]["google_safe_browsing"] = "clean"
    except Exception as e:  # noqa: BLE001
        log.warning("Safe Browsing check failed: %s", e)
        for u in urls:
            out[u]["google_safe_browsing"] = "error"


async def _vt(http: httpx.AsyncClient, s: Settings, url: str, out: dict) -> None:
    uid = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
    try:
        r = await http.get(VT_URL + uid, headers={"x-apikey": s.virustotal_api_key},
                           timeout=s.external_timeout_s)
        if r.status_code == 404:
            out[url]["virustotal"] = "unknown"      # VirusTotal has never seen this URL
        elif r.status_code == 429:
            out[url]["virustotal"] = "rate_limited"
        else:
            r.raise_for_status()
            stats = r.json()["data"]["attributes"]["last_analysis_stats"]
            mal = int(stats.get("malicious", 0))
            if mal >= s.vt_min_malicious:
                out[url]["virustotal"] = "flagged"
                out[url].setdefault("detail", []).append(f"VirusTotal: {mal} security vendors flag this link")
            else:
                out[url]["virustotal"] = "clean"
    except Exception as e:  # noqa: BLE001
        log.warning("VirusTotal check failed: %s", e)
        out[url]["virustotal"] = "error"


async def check_reputation(http: httpx.AsyncClient, urls: list[str], s: Settings) -> tuple[dict[str, dict], list[str]]:
    """Returns ({url: result}, [services_used])."""
    urls = list(dict.fromkeys(urls))[: s.max_links_checked]
    used: list[str] = []
    if not urls:
        return {}, used
    out = {u: {"google_safe_browsing": "unchecked", "virustotal": "unchecked", "flagged": False}
           for u in urls}
    jobs = []
    if s.google_safe_browsing_api_key:
        used.append("google_safe_browsing")
        jobs.append(_gsb(http, s, urls, out))
    if s.virustotal_api_key:
        used.append("virustotal")
        jobs.extend(_vt(http, s, u, out) for u in urls)
    if jobs:
        await asyncio.gather(*jobs)
    for u in urls:
        out[u]["flagged"] = "flagged" in (out[u]["google_safe_browsing"], out[u]["virustotal"])
    return out, used
