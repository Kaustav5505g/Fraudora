"""Layer 1c: scam-type signatures (the weighted-vector step).

Single rules are weak on their own: a short link is only 15 points, a "click now" only 10.
But certain *combinations* are the fingerprint of one specific scam. When a signature's
elements are all present, the points of the weak rules it absorbs are MOVED out of their own
categories into the signature's category, and a visible bonus is added. The result is a
total that shows up as one clear finding (e.g. "Fake credit / claim lure") instead of
several small ones. Signatures only ever add to scams that match them: they never fire
for a single rule, so ordinary messages are unaffected.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..models import Finding, SignatureHit

LINK_RULES = ("shortened_url", "suspicious_link", "reported_malicious_link")


@dataclass(frozen=True)
class Signature:
    id: str
    label: str
    group: str
    sub: str
    requires: tuple[str, ...]        # every one of these rules must have fired
    requires_any: tuple[str, ...]    # and at least one of these
    absorbs: tuple[str, ...]         # weak rules whose points move into the signature
    bonus: int
    why: str
    advice: str


SIGNATURES: list[Signature] = [
    Signature(
        "sig_fake_credit", "Fake credit / claim lure", "lure", "money_credit",
        requires=("money_claim_bait",), requires_any=LINK_RULES,
        absorbs=("shortened_url", "click_cta"), bonus=25,
        why="'Money received, claim it here' plus an unknown link is how fake-credit scams steal "
            "logins and card details.",
        advice="Do not tap the link. Check your balance only in your bank's own app."),
    Signature(
        "sig_fake_notice", "Fake account / order notice", "lure", "notification",
        requires=("txn_notice",), requires_any=LINK_RULES,
        absorbs=("shortened_url", "click_cta"), bonus=30,
        why="A credit, balance or delivery 'notice' that only gives a link to open is how scammers "
            "steal logins. Real banks and shops name the sender and use their own website.",
        advice="Do not open the link. Check your account or order only in the official app."),
    Signature(
        "sig_job_fee", "Job offer asking for a fee", "lure", "job",
        requires=("job_lure", "payment_fee"), requires_any=(),
        absorbs=("payment_fee",), bonus=25,
        why="A job that asks you to pay a 'registration' or 'refundable' fee is a classic advance-fee scam.",
        advice="Never pay to get a job. Real employers do not charge candidates."),
    Signature(
        "sig_investment_lure", "Investment / trading scam", "lure", "trading",
        requires=("investment_lure",), requires_any=LINK_RULES + ("group_invite", "click_cta"),
        absorbs=("shortened_url", "click_cta", "group_invite"), bonus=20,
        why="Profit promises together with a link or group invite is the usual first step of "
            "an investment scam.",
        advice="Do not click or join. Invest only through apps of SEBI-registered brokers."),
]


def _severity(points: int) -> str:
    return "high" if points >= 35 else "medium" if points >= 20 else "low"


def apply_signatures(findings: dict[str, Finding]) -> list[SignatureHit]:
    """Mutates `findings` (absorbed rules drop to 0 points, a signature finding is added)."""
    hits: list[SignatureHit] = []
    for sig in SIGNATURES:
        if not all(r in findings for r in sig.requires):
            continue
        if sig.requires_any and not any(r in findings for r in sig.requires_any):
            continue
        absorbed = [r for r in sig.absorbs if r in findings and findings[r].points > 0]
        moved = 0
        for rid in absorbed:
            moved += findings[rid].points
            findings[rid].points = 0
            findings[rid].moved_to = sig.id
        total = moved + sig.bonus
        findings[sig.id] = Finding(
            rule_id=sig.id, label=sig.label, category=sig.group, group=sig.group,
            sub_category=sig.sub, severity=_severity(total), points=total, base_points=total,
            why=sig.why, advice=sig.advice, matches=[],
            details=[f"Combination of: {', '.join(sorted(set(sig.requires) | set(absorbed)))}"],
        )
        hits.append(SignatureHit(id=sig.id, label=sig.label, group=sig.group, sub_category=sig.sub,
                                 points=total, bonus=sig.bonus, moved=moved, absorbed=absorbed))
    return hits
