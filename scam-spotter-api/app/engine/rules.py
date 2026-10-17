"""Layer 1: deterministic, visible rules.

Every rule has a fixed point value. A rule counts ONCE per message (even if it
matches several times), and the total is capped at 100. Nothing here uses AI.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Rule:
    id: str
    label: str
    category: str
    points: int
    why: str       # plain-language "why it matters"
    advice: str    # what to do about it

    @property
    def severity(self) -> str:
        return "high" if self.points >= 35 else "medium" if self.points >= 20 else "low"


_R = [
    Rule("fake_urgency", "Fake urgency", "urgency", 20,
         "Pressure stops people from thinking. Scammers rush you so you act before you check.",
         "Slow down. Real organisations give you time and never demand action within minutes."),
    Rule("account_threat", "Account threat", "threat", 15,
         "Scammers use fear of losing access to your account, SIM or money.",
         "Don't act on the message. Open the official app or website yourself and check your account."),
    Rule("suspicious_link", "Suspicious link", "link", 25,
         "The link is not an official website. It copies a trusted name or hides where it really goes.",
         "Do not click the link."),
    Rule("shortened_url", "Shortened link", "link", 15,
         "Short links hide the real destination, so you cannot tell where they lead.",
         "Do not open short links in unexpected messages. Ask for the full official address."),
    Rule("otp_request", "OTP request", "otp", 40,
         "A bank, college or courier will never ask you to share an OTP. Anyone who asks is trying to get into your account.",
         "Never share an OTP with anyone."),
    Rule("credential_request", "Password / PIN / card request", "credentials", 40,
         "Genuine organisations never ask for your password, PIN, CVV or card details by message.",
         "Never share your password, PIN, CVV or card details."),
    Rule("prize_bait", "Prize or lottery bait", "bait", 25,
         "Surprise prizes, lotteries and refunds are bait to make you click or hand over details.",
         "Ignore the prize or refund claim. You cannot win a contest you never entered."),
    Rule("legal_threat", "Legal threat", "legal", 20,
         "Threats of arrest or legal action are used to frighten people into paying or obeying.",
         "Real police and courts do not threaten you by message. Do not pay or reply."),
    Rule("payment_fee", "Request to pay a fee", "payment", 25,
         "Scammers ask for small 'fees' to release a parcel, prize or blocked account. The money goes to them.",
         "Do not pay anything because of this message."),
    Rule("delivery_pretext", "Delivery problem pretext", "delivery", 10,
         "Fake 'parcel on hold' messages are a common way to lure people to fake pages.",
         "Check your order only in the courier's or shop's official app."),
    Rule("reported_malicious_link", "Link reported as dangerous", "reputation", 40,
         "Google Safe Browsing or VirusTotal lists this link as malicious.",
         "Do not open the link."),
]
RULES: dict[str, Rule] = {r.id: r for r in _R}


@dataclass(frozen=True)
class Match:
    start: int
    end: int
    text: str


# ---------------------------------------------------------------- patterns
_I = re.IGNORECASE

URGENCY = re.compile(
    r"\b(?:today|tonight|immediately|right\s+now|at\s+once|asap|urgent(?:ly)?"
    r"|within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?|days?)"
    r"|last\s+(?:warning|chance|reminder)|final\s+(?:notice|warning|reminder)"
    r"|expires?\s+(?:today|soon|tonight)|act\s+now|hurry|without\s+delay|before\s+midnight)\b", _I)

ACCOUNT_THREAT = [
    re.compile(r"\b(?:account|a/c|card|sim|number|wallet|upi|services?)\b[^.!?\n]{0,40}?"
               r"\b(?:will\s+be|is\s+being|has\s+been|shall\s+be|may\s+be|gets?)\s+"
               r"(?:blocked|suspended|closed|deactivated|frozen|terminated|disabled|restricted|locked)\b", _I),
    re.compile(r"\bkyc\b[^.!?\n]{0,30}?\b(?:incomplete|pending|expired|expiring"
               r"|not\s+(?:updated|completed|verified)|required|mandatory)\b", _I),
    re.compile(r"\b(?:update|complete|verify|renew)\s+(?:your\s+)?(?:kyc|pan|aadhaar|aadhar)\b", _I),
    re.compile(r"\b(?:suspicious|unusual|unauthori[sz]ed)\s+(?:activity|login|sign-?in|transaction|access)\b", _I),
]

PRIZE = re.compile(
    r"\b(?:you(?:['’]ve|\s+have)?\s+(?:won|been\s+selected|been\s+chosen)"
    r"|congratulations[^.!?\n]{0,60}(?:won|prize|winner|reward|gift)"
    r"|lottery|lucky\s+(?:draw|winner|customer)|jackpot"
    r"|claim\s+(?:your\s+)?(?:prize|reward|gift|cashback|refund)"
    r"|free\s+(?:gift|iphone|recharge)|cash\s?prize)\b", _I)

LEGAL = re.compile(
    r"\b(?:legal\s+(?:action|notice|proceedings)|court\s+(?:case|notice|summons|order)"
    r"|arrest(?:ed)?|arrest\s+warrant|warrant\s+(?:has\s+been|is)\s+issued"
    r"|police\s+(?:case|complaint|action)|(?-i:FIR)"
    r"|case\s+(?:will\s+be|has\s+been|is\s+being)\s+(?:filed|registered)"
    r"|cyber\s?crime\s+(?:cell|branch|department)|money\s+laundering|prosecut\w*|imprison\w*|jail)\b", _I)

PAYMENT = [
    re.compile(r"\b(?:processing|registration|release|redelivery|re-delivery|customs|clearance|handling"
               r"|activation|reactivation|unblock(?:ing)?|token|advance)\s+"
               r"(?:fee|fees|charges?|duty|amount|payment)\b", _I),
    re.compile(r"\b(?:pay|deposit|transfer|send)\s+(?:a\s+|an\s+|the\s+)?(?:small\s+|nominal\s+)?"
               r"(?:fee|fine|charges?|amount|₹\s?\d[\d,]*|rs\.?\s?\d[\d,]*|inr\s?\d[\d,]*)"
               r"[^.!?\n]{0,40}?\b(?:to|for)\s+(?:receive|release|claim|avoid|unblock|reactivate|reschedule"
               r"|redeliver|re-deliver|get|activate|verify|confirm|clear)\b", _I),
    re.compile(r"\bpay(?:ment)?\s+(?:a\s+)?(?:small|nominal|refundable)\s+(?:fee|amount|deposit)\b", _I),
]

DELIVERY = [
    re.compile(r"\b(?:parcel|package|shipment|courier|consignment|order)\b[^.!?\n]{0,50}?"
               r"\b(?:on\s+hold|held|could\s+not\s+be\s+delivered|couldn['’]?t\s+be\s+delivered|undelivered"
               r"|unable\s+to\s+deliver|returned|address\s+(?:is\s+)?(?:incomplete|invalid|incorrect)"
               r"|pending\s+delivery|delivery\s+failed)\b", _I),
    re.compile(r"\b(?:update|confirm|verify|complete)\s+(?:your\s+)?(?:delivery\s+)?address\b", _I),
]

_VERBS = (r"(?:share|send|tell|give|provide|forward|enter|confirm|submit|type|reply\s+with"
          r"|read\s+out|disclose|fill\s+in|key\s+in|input)")
_OTP_OBJ = (r"(?:otp|o\.t\.p\.?|one[\s-]?time[\s-]?(?:password|pin|passcode|code)|verification\s+code"
            r"|security\s+code|auth(?:entication)?\s+code|login\s+code)")
_CRED_OBJ = (r"(?:(?<!time[ -])password|passcode|(?<!time[ -])pin(?!\s*code)|upi\s*pin|atm\s*pin|mpin|cvv|cvc"
             r"|card\s+number|card\s+details|(?:debit|credit)\s+card(?:\s+(?:number|details))?|expiry\s+date"
             r"|net\s?banking\s+(?:id|password|details)|login\s+(?:id|details|credentials)"
             r"|aadhaar\s+number|aadhar\s+number|pan\s+number|bank\s+(?:account\s+)?details)")


def _req(obj: str) -> re.Pattern:
    return re.compile(rf"\b(?P<verb>{_VERBS})\b[^.!?\n]{{0,40}}?\b(?P<obj>{obj})(?![\w])", _I)


OTP_REQ = _req(_OTP_OBJ)
CRED_REQ = _req(_CRED_OBJ)
_OTP_WORD = re.compile(rf"\b{_OTP_OBJ}(?![\w])", _I)
_ADVISORY = re.compile(r"\b(?:do\s+not|don['’]?t|never)\s+share\b", _I)

# "never share", "do not ever share", "bank will never ask you to share" -> a warning, not a request.
# Negation must sit right before the verb with no punctuation in between, so
# "Do not ignore this; share the OTP" is still treated as a request.
_NEG_BEFORE = re.compile(
    r"\b(?:do\s+not|don['’]?t|never|not|no\s+one|nobody|should\s+not|shouldn['’]?t|must\s+not"
    r"|mustn['’]?t|won['’]?t|will\s+not|cannot|can['’]?t|avoid)\s+(?:[\w'’-]+\s+){0,4}$", _I)


def _negated(text: str, verb_start: int) -> bool:
    return bool(_NEG_BEFORE.search(text[max(0, verb_start - 45):verb_start]))


def _all(rx: re.Pattern, text: str) -> list[Match]:
    return [Match(m.start(), m.end(), m.group(0)) for m in rx.finditer(text)]


def _requests(rx: re.Pattern, text: str) -> tuple[list[Match], bool]:
    hits, negated = [], False
    for m in rx.finditer(text):
        if _negated(text, m.start("verb")):
            negated = True
            continue
        hits.append(Match(m.start("verb"), m.end("obj"), text[m.start("verb"):m.end("obj")]))
    return hits, negated


def merge(ms: list[Match], text: str) -> list[Match]:
    out: list[Match] = []
    for m in sorted(ms, key=lambda x: (x.start, x.end)):
        if out and m.start < out[-1].end:
            last = out[-1]
            end = max(last.end, m.end)
            out[-1] = Match(last.start, end, text[last.start:end])
        else:
            out.append(m)
    return out


def find_text_matches(text: str) -> tuple[dict[str, list[Match]], list[str]]:
    """Return ({rule_id: matches}, reassurances) for the text-based rules."""
    found: dict[str, list[Match]] = {}
    reassurances: list[str] = []

    def put(rid: str, ms: list[Match]) -> None:
        if ms:
            found[rid] = merge(ms, text)

    put("fake_urgency", _all(URGENCY, text))
    put("account_threat", [m for rx in ACCOUNT_THREAT for m in _all(rx, text)])
    put("prize_bait", _all(PRIZE, text))
    put("legal_threat", _all(LEGAL, text))
    put("payment_fee", [m for rx in PAYMENT for m in _all(rx, text)])
    put("delivery_pretext", [m for rx in DELIVERY for m in _all(rx, text)])

    otp, otp_neg = _requests(OTP_REQ, text)
    put("otp_request", otp)
    cred, cred_neg = _requests(CRED_REQ, text)
    put("credential_request", cred)

    if (otp_neg or _ADVISORY.search(text)) and _OTP_WORD.search(text) and not otp:
        reassurances.append("The message tells you not to share your OTP, as genuine OTP messages do.")
    elif cred_neg and not cred:
        reassurances.append("The message warns you not to share your PIN or password, as genuine messages do.")
    return found, reassurances
