"""Fuzzy match a message against the known-scam library (stdlib only, no API)."""
from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher

from .normalize import normalize, tokens

# Placeholder tokens carry no scam-specific meaning, so they don't count as "shared content".
_PLACEHOLDERS = {"<link>", "<amt>", "<num>", "<date>", "<email>"}
# Words too common to prove two messages are the same scam.
_STOP = {"your", "you", "the", "a", "to", "is", "has", "been", "for", "of", "on", "at", "and",
         "please", "dear", "this", "will", "are", "we", "our", "in", "it", "now", "by", "no"}


@dataclass(frozen=True)
class KnownScam:
    id: str
    label: str
    norm: str
    tokenset: frozenset[str]


def prepare(id: str, label: str, raw_text: str) -> KnownScam:
    n = normalize(raw_text)
    content = frozenset(t for t in tokens(n) if t not in _PLACEHOLDERS and t not in _STOP)
    return KnownScam(id=id, label=label, norm=n, tokenset=content)


def _ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


@dataclass(frozen=True)
class MatchResult:
    scam: KnownScam
    ratio: float          # 0..1 sequence similarity on normalised text
    overlap: float        # 0..1 share of the message's content words also in the scam
    shared: int           # count of shared distinctive content words


def best_match(message: str, library: list[KnownScam], min_shared: int) -> MatchResult | None:
    n = normalize(message)
    content = frozenset(t for t in tokens(n) if t not in _PLACEHOLDERS and t not in _STOP)
    if not content:
        return None
    best: MatchResult | None = None
    for scam in library:
        shared = content & scam.tokenset
        if len(shared) < min_shared:
            continue
        overlap = len(shared) / len(content) if content else 0.0
        r = _ratio(n, scam.norm)
        cand = MatchResult(scam=scam, ratio=r, overlap=overlap, shared=len(shared))
        if best is None or (cand.ratio, cand.overlap) > (best.ratio, best.overlap):
            best = cand
    return best
