from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from .config import get_settings
from .engine.text import sanitize

Level = Literal["safe", "suspicious", "high_risk"]
LinkStatus = Literal["official", "suspicious", "shortened", "unverified", "reported_dangerous"]

CLIENT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")


class ScanRequest(BaseModel):
    message: str = Field(description="The suspicious message or link, pasted as-is.")

    @field_validator("message")
    @classmethod
    def _clean(cls, v: str) -> str:
        v = sanitize(v)
        if not v:
            raise ValueError("Please paste a message or link to scan.")
        limit = get_settings().max_message_chars
        if len(v) > limit:
            raise ValueError(f"That message is too long. Please paste up to {limit} characters.")
        return v


class Span(BaseModel):
    start: int
    end: int
    text: str


class Finding(BaseModel):
    rule_id: str
    label: str
    category: str
    severity: Literal["low", "medium", "high"]
    points: int
    why: str
    advice: str
    matches: list[Span]
    details: list[str] = []
    group: str = ""
    sub_category: str = ""
    base_points: int = 0              # points before a signature moved them
    moved_to: Optional[str] = None    # signature id that absorbed this rule's points


class SignatureHit(BaseModel):
    id: str
    label: str
    group: str
    sub_category: str
    points: int       # total now carried by the signature (moved + bonus)
    bonus: int
    moved: int        # points taken from the weaker rules
    absorbed: list[str]


class LinkReport(BaseModel):
    url: str
    host: str
    status: LinkStatus
    reasons: list[str]
    span: Span
    reputation: Optional[dict] = None


class Segment(BaseModel):
    """A slice of the message. `rules` lists the rule ids that highlight it (empty = plain text)."""
    text: str
    rules: list[str] = []


class Thresholds(BaseModel):
    safe: tuple[int, int]
    suspicious: tuple[int, int]
    high_risk: tuple[int, int]


class EngineInfo(BaseModel):
    ai_used: bool
    reputation_checked: list[str]


class ScanResponse(BaseModel):
    id: str
    created_at: str
    message: str
    score: int
    raw_score: int
    level: Level
    label: str
    headline: str
    thresholds: Thresholds
    findings: list[Finding]
    category_scores: dict[str, int] = {}     # points per broad group, after signatures
    signatures: list[SignatureHit] = []
    segments: list[Segment]
    links: list[LinkReport]
    reassurances: list[str]
    caveats: list[str]
    summary: str
    ai_summary: Optional[str] = None
    known_match: Optional[dict] = None     # {id,label,ratio,points} when a known scam matched
    next_steps: list[str]
    report: dict
    disclaimer: str
    engine: EngineInfo
    saved: bool = False
