"""Orchestrates the hybrid engine: rules -> link checks -> score -> (optional) AI explanation."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

import httpx

from ..config import Settings
from ..models import (EngineInfo, Finding, LinkReport, ScanResponse, Segment, Span, Thresholds)
from .explain import ai_explain
from .links import LinkInfo, analyze_links
from .reputation import check_reputation
from .dynamic import DynamicConfig, KeywordRule, load
from .matcher import best_match
from .rules import RULES, Match, find_text_matches
from .signatures import apply_signatures

LABELS = {"safe": "Safe", "suspicious": "Suspicious", "high_risk": "High Risk"}
HEADLINES = {
    "safe": "Looks safe: no strong warning signs found",
    "suspicious": "Suspicious: be careful before you act",
    "high_risk": "Likely fraud: do not respond",
}
DISCLAIMER = ("Automatic checks cannot prove a message is genuine. If money, passwords or personal "
              "details are involved, confirm through the official app or website.")
REPORT = {"website": "https://cybercrime.gov.in", "helpline": "1930", "country": "India"}


def level_for(score: int, s: Settings) -> str:
    return "safe" if score <= s.safe_max else "suspicious" if score <= s.suspicious_max else "high_risk"


def _lc(label: str) -> str:
    """Lower-case a rule label but keep acronyms (OTP, PIN) upper-case."""
    return " ".join(w if w.isupper() else w.lower() for w in label.split())


def _join(items: list[str]) -> str:
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " and " + items[-1]


def _finding(rule_id: str, matches: list[Match], details: list[str] | None = None) -> Finding:
    r = RULES[rule_id]
    return Finding(rule_id=r.id, label=r.label, category=r.category, severity=r.severity, points=r.points,
                   group=r.group, sub_category=r.sub, base_points=r.points,
                   why=r.why, advice=r.advice, details=details or [],
                   matches=[Span(start=m.start, end=m.end, text=m.text) for m in matches])


def _keyword_matches(text: str, kw: KeywordRule) -> list[Match]:
    out: list[Match] = []
    for phrase in kw.phrases:
        p = phrase.strip()
        if not p:
            continue
        pat = re.escape(p)
        if kw.word_boundary and p[:1].isalnum() and p[-1:].isalnum():
            pat = rf"\b{pat}\b"
        for m in re.finditer(pat, text, re.IGNORECASE):
            out.append(Match(m.start(), m.end(), m.group(0)))
    return out


def _kw_finding(kw: KeywordRule, matches: list[Match]) -> Finding:
    sev = "high" if kw.points >= 35 else "medium" if kw.points >= 20 else "low"
    return Finding(rule_id=kw.id, label=kw.label, category=kw.category, group=kw.group,
                   sub_category=kw.sub, severity=sev, points=kw.points, base_points=kw.points,
                   why=kw.why, advice=kw.advice,
                   matches=[Span(start=m.start, end=m.end, text=m.text) for m in matches])


def _apply_overrides(findings: dict[str, Finding], dyn: DynamicConfig) -> None:
    for rid in list(findings):
        if rid in dyn.disabled:
            del findings[rid]
            continue
        ov = dyn.overrides.get(rid)
        if not ov:
            continue
        f = findings[rid]
        if ov.points is not None:
            f.points = ov.points
            f.base_points = ov.points
            f.severity = "high" if ov.points >= 35 else "medium" if ov.points >= 20 else "low"
        for attr, val in (("label", ov.label), ("category", ov.category), ("group", ov.group),
                          ("sub_category", ov.sub), ("why", ov.why), ("advice", ov.advice)):
            if val:
                setattr(f, attr, val)


def _segments(text: str, findings: list[Finding]) -> list[Segment]:
    cuts = {0, len(text)}
    for f in findings:
        for m in f.matches:
            cuts.update((m.start, m.end))
    pts = sorted(cuts)
    segs: list[Segment] = []
    for a, b in zip(pts, pts[1:]):
        rules = [f.rule_id for f in findings if any(m.start <= a and b <= m.end for m in f.matches)]
        segs.append(Segment(text=text[a:b], rules=rules))
    return segs


def _next_steps(level: str, findings: list[Finding]) -> list[str]:
    steps: list[str] = []
    ids = {f.rule_id for f in findings}
    if level != "safe":
        for f in sorted(findings, key=lambda f: -f.points):
            if f.advice not in steps:
                steps.append(f.advice)
        steps.append("Contact the bank, college or courier only through its official app, website "
                     "or the number printed on your card, passbook or ID.")
        if ids & {"otp_request", "credential_request"} or level == "high_risk":
            steps.append("If you already shared an OTP, password or card details, contact your bank "
                         "straight away and block the card or account.")
        steps.append("Report scams at cybercrime.gov.in or call 1930 (India).")
    else:
        steps.append("If you were not expecting this message, check with the sender through an "
                     "official channel before acting on it.")
        steps.append("Never share an OTP, password or PIN with anyone. If anything feels wrong, report it "
                     "at cybercrime.gov.in or call 1930 (India).")
    return steps


def _summary(level: str, score: int, findings: list[Finding]) -> str:
    if not findings:
        return f"We did not find any warning signs in this message (score {score}/100)."
    if level == "safe":
        return (f"We found {len(findings)} minor note{'s' if len(findings) > 1 else ''} "
                f"({_join([_lc(f.label) for f in findings])}), but not enough to look risky "
                f"(score {score}/100).")
    top = max(findings, key=lambda f: f.points)
    n = len(findings)
    return (f"This message shows {n} warning sign{'s' if n > 1 else ''}: "
            f"{_join([_lc(f.label) for f in findings])}. Together they score {score}/100, "
            f"which is {LABELS[level]}. Most serious: {top.why}")


def _link_report(l: LinkInfo, rep: dict | None) -> LinkReport:
    return LinkReport(url=l.url, host=l.host, status=l.status, reasons=l.reasons, reputation=rep,
                      span=Span(start=l.start, end=l.end, text=l.raw))


async def analyze(message: str, s: Settings, http: httpx.AsyncClient,
                  dyn: DynamicConfig | None = None) -> ScanResponse:
    """`message` must already be sanitised (ScanRequest does this)."""
    if dyn is None:
        dyn = await load(s, http)
    text_matches, reassurances = find_text_matches(message)
    links = analyze_links(message)
    findings: dict[str, Finding] = {rid: _finding(rid, ms) for rid, ms in text_matches.items()}

    # Extra keyword rules defined in the database
    for kw in dyn.keyword_rules:
        ms = _keyword_matches(message, kw)
        if ms:
            findings[kw.id] = _kw_finding(kw, ms)

    # Layer 1b: link reputation (optional, fail-open)
    rep, used = await check_reputation(http, [l.url for l in links if l.lookup_eligible], s)
    for l in links:
        if rep.get(l.url, {}).get("flagged"):
            l.status = "reported_dangerous"
            l.reasons.extend(rep[l.url].get("detail", []))

    def span(l: LinkInfo) -> Match:
        return Match(l.start, l.end, l.raw)

    def details(ls: list[LinkInfo]) -> list[str]:
        return [f"{l.host}: {r}" for l in ls for r in l.reasons]

    susp = [l for l in links if l.status == "suspicious"]
    short = [l for l in links if l.status == "shortened"]
    bad = [l for l in links if l.status == "reported_dangerous"]
    if susp:
        findings["suspicious_link"] = _finding("suspicious_link", [span(l) for l in susp], details(susp))
    if short:
        findings["shortened_url"] = _finding("shortened_url", [span(l) for l in short], details(short))
    if bad:
        findings["reported_malicious_link"] = _finding(
            "reported_malicious_link", [span(l) for l in bad], details(bad))

    _apply_overrides(findings, dyn)

    # Known-scam library match (fuzzy, no AI). Its own finding; signatures ignore it.
    known_match = None
    if dyn.known:
        mr = best_match(message, list(dyn.known), s.known_scam_min_shared)
        if mr and mr.ratio >= s.known_scam_threshold:
            strong = mr.ratio >= s.known_scam_strong_threshold
            pts = s.known_scam_strong_points if strong else s.known_scam_points
            findings["known_scam_match"] = Finding(
                rule_id="known_scam_match",
                label="Matches a known scam", category="known", group="known",
                sub_category="library", severity="high" if pts >= 35 else "medium",
                points=pts, base_points=pts,
                why=f"This message closely matches a scam already in our records "
                    f"(\"{mr.scam.label}\", {int(mr.ratio * 100)}% similar).",
                advice="Treat it as a scam. Do not click links, pay, or share any code or detail.",
                matches=[], details=[f"Similar to known scam: {mr.scam.label}"])
            known_match = {"id": mr.scam.id, "label": mr.scam.label,
                           "ratio": round(mr.ratio, 3), "points": pts}

    sig_hits = apply_signatures(findings)
    ordered = sorted(findings.values(), key=lambda f: (min((m.start for m in f.matches), default=10**9)))
    raw = sum(f.points for f in ordered)
    category_scores: dict[str, int] = {}
    for f in ordered:
        if f.points:
            category_scores[f.group] = category_scores.get(f.group, 0) + f.points
    score = min(100, raw)
    level = level_for(score, s)

    caveats: list[str] = []
    unverified = [l for l in links if l.status == "unverified"]
    for l in unverified[:3]:
        caveats.append(f"We could not verify {l.host} as an official website. "
                       "Do not open it unless you trust the sender.")
    if len(links) == 1 and links[0].start == 0 and links[0].end == len(message):
        caveats.append("You pasted only a link. Without the message around it, only the link itself "
                       "could be checked.")

    active = [f for f in ordered if f.points > 0]
    summary = _summary(level, score, active)
    ai_text = None
    if s.gemini_api_key and active and score >= s.llm_min_score:
        signs = [f"{f.label} ({f.points} pts): " + ", ".join(f'"{m.text}"' for m in f.matches[:3])
                 for f in active]
        ai_text = await ai_explain(http, s, message, LABELS[level], score, signs)

    return ScanResponse(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc).isoformat(),
        message=message, score=score, raw_score=raw, level=level, label=LABELS[level],
        headline=HEADLINES[level],
        thresholds=Thresholds(safe=(0, s.safe_max), suspicious=(s.safe_max + 1, s.suspicious_max),
                              high_risk=(s.suspicious_max + 1, 100)),
        findings=ordered, category_scores=category_scores, signatures=sig_hits, segments=_segments(message, ordered),
        links=[_link_report(l, rep.get(l.url)) for l in links],
        reassurances=reassurances, caveats=caveats, summary=summary, ai_summary=ai_text,
        known_match=known_match,
        next_steps=_next_steps(level, active), report=REPORT, disclaimer=DISCLAIMER,
        engine=EngineInfo(ai_used=ai_text is not None, reputation_checked=used),
    )
