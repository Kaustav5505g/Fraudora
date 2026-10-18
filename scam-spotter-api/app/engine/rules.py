"""Layer 1: deterministic, visible rules.

Every rule has a fixed point value. A rule counts ONCE per message (even if it
matches several times), and the total is capped at 100. Nothing here uses AI.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Rule:
    id: str
    label: str
    category: str
    points: int
    why: str       # plain-language "why it matters"
    advice: str    # what to do about it
    group: str = ""  # broad bucket shown to the user (see GROUPS)
    sub: str = ""    # finer label inside the group (e.g. "trading" inside "lure")

    @property
    def severity(self) -> str:
        return "high" if self.points >= 35 else "medium" if self.points >= 20 else "low"


# Broad buckets shown to the user. The first four are the categories from the problem
# statement; "lure" holds every other kind of bait so the screen is never overwhelming.
GROUPS = {
    "pressure": "Urgency & pressure",
    "threat": "Account threat",
    "link": "Suspicious link",
    "request": "OTP & credential requests",
    "lure": "Bait & scams",
    "known": "Matches a known scam",
}
_PLACE = {
    "fake_urgency": ("pressure", "urgency"), "click_cta": ("pressure", "call_to_action"),
    "account_threat": ("threat", "account"), "legal_threat": ("threat", "legal"),
    "suspicious_link": ("link", "lookalike"), "shortened_url": ("link", "shortened"),
    "reported_malicious_link": ("link", "reported"),
    "otp_request": ("request", "otp"), "credential_request": ("request", "credentials"),
    "payment_fee": ("request", "payment"),
    "prize_bait": ("lure", "prize"), "money_claim_bait": ("lure", "money_credit"),
    "investment_lure": ("lure", "trading"), "group_invite": ("lure", "trading"),
    "delivery_pretext": ("lure", "delivery"),
    "txn_notice": ("lure", "notification"), "bill_pretext": ("lure", "utility"), "job_lure": ("lure", "job"),
}

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
    Rule("money_claim_bait", "Money to claim", "bait", 20,
         "Messages that say money is waiting for you to 'claim' are bait. No real money arrives by clicking a link.",
         "Ignore the claim. Check your real balance only in your bank's official app."),
    Rule("click_cta", "Pushy 'click now' instruction", "urgency", 10,
         "Scam messages tell you to tap a link right away so you do not stop and think.",
         "Do not tap links you were not expecting."),
    Rule("investment_lure", "Investment or trading lure", "bait", 25,
         "Guaranteed profits, 'VIP' tips and trading signals are the usual start of investment scams.",
         "No one can guarantee profit. Ignore tips from unknown senders and check SEBI registration."),
    Rule("txn_notice", "Fake account or order notice", "bait", 15,
         "Scam texts pose as a credit, balance, bill or delivery update, often with a made-up account number.",
         "Check the real balance or order in your bank's or shop's own app."),
    Rule("bill_pretext", "Unpaid bill pretext", "bait", 20,
         "'Your electricity, gas or mobile connection will be cut' is a common fear trick to get a quick payment.",
         "Check bills only in the provider's official app or on the paper bill."),
    Rule("job_lure", "Job or earning offer", "bait", 25,
         "Unasked work-from-home jobs and easy-money offers are used to collect 'registration fees' or personal details.",
         "Real employers do not ask you to pay to get a job. Ignore the offer."),
    Rule("group_invite", "Invite to a chat group", "bait", 10,
         "Scammers move victims into WhatsApp or Telegram groups where fake 'experts' push them to pay.",
         "Do not join groups from unknown senders."),
]
RULES: dict[str, Rule] = {
    r.id: replace(r, group=_PLACE[r.id][0], sub=_PLACE[r.id][1]) for r in _R}


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

_AMT = r"(?:rs\.?|₹|inr)\s?\d"
MONEY_CLAIM = [
    re.compile(rf"\bclaim\b[^\n]{{0,60}}?{_AMT}", _I),
    re.compile(rf"{_AMT}[\d,.]*[^\n]{{0,60}}?\bclaim\b", _I),
    re.compile(rf"\b(?:recd|received|credited|deposited)\b[^.!?\n]{{0,15}}?{_AMT}[^\n]{{0,80}}?"
               r"\b(?:claim|check\s+now|click|tap|link)\b", _I),
]
_LINKISH = r"(?=(?:https?://|www\.|bit\.ly|tinyurl|t\.co/|cutt\.ly|rb\.gy|is\.gd))"
CLICK_TO_LINK = re.compile(
    r"\b(?:clk|click|tap|open|visit|view|check|pay|login|track)\b[^.!?\n]{0,20}?" + _LINKISH, _I)
TXN_NOTICE = [
    re.compile(rf"\b(?:received|credited|debited|settled|withdraw|withdrawn|unpaid|due\s+amount|outstanding"
               rf"|shortage)\b[^\n]{{0,40}}?{_AMT}", _I),
    re.compile(rf"{_AMT}[\d,.]*[^\n]{{0,40}}?\b(?:received|credited|debited|settled|unpaid|shipped)\b", _I),
    re.compile(r"\border\b[^!?\n]{0,30}?\b(?:out\s+for\s+delivery|shipped|dispatched|delivered)\b", _I),
]
BILL = re.compile(
    r"\b(?:electricity|power|water|gas|mobile|broadband|postpaid|phone)\b[^.!?\n]{0,40}?"
    r"\b(?:bill|connection|supply|service|payment)\b[^.!?\n]{0,50}?"
    r"\b(?:unpaid|overdue|pending|disconnect\w*|cut\s+off|terminat\w+|suspend\w*|due)\b"
    r"|\b(?:unpaid|overdue|pending)\s+(?:electricity|power|water|gas|mobile)\s+bill\b", _I)
JOB = re.compile(
    r"\b(?:work[-\s]?from[-\s]?home|wfh|(?:part|full)[-\s]?time\s+(?:job|work|income)"
    r"|(?:job|position|role|vacancy)\s+(?:offer|opening)"
    r"|selected\s+for\s+(?:a\s+|the\s+)?(?:[\w-]+\s+){0,4}?(?:job|work|position|role)"
    r"|earn\s+(?:up\s+to\s+)?(?:rs\.?|₹|inr)?\s?\d[\d,]*\s*(?:/|per|a)\s*(?:day|week|month|hour)"
    r"|salary\s+(?:of\s+)?(?:rs\.?|₹|inr)\s?\d[\d,]*|like\s+(?:and|&)\s+earn)\b", _I)
CLICK_CTA = re.compile(
    r"\b(?:check|click|tap|open|visit|login|log\s+in|verify|update|claim|apply|join|register|download|see)"
    r"\s+(?:it\s+)?(?:now|here|below|the\s+link|this\s+link|link)\b|\blink\s+below\b", _I)
INVEST = re.compile(
    r"\b(?:(?:guaranteed|assured|fixed|risk[-\s]?free)\s+(?:profits?|returns?|income)"
    r"|(?:double|triple)\s+your\s+(?:money|investment)"
    r"|(?:stock|trading|share\s+market|intraday|crypto|forex|ipo|option)s?\s+(?:tips?|signals?|calls?|advisory|course)"
    r"|vip\s+(?:group|tips?|membership|trading|members?)"
    r"|(?:daily|\d+)\s*%\s+(?:profit|returns?))\b", _I)
GROUP_INVITE = re.compile(
    r"\b(?:join|add\s+you\s+to|invite\s+you\s+to)\b[^.!?\n]{0,30}?\b(?:whatsapp|telegram)\b[^.!?\n]{0,15}?"
    r"\b(?:group|channel|community)\b", _I)

_VERBS = (r"(?:share|send|tell|give|provide|forward|enter|confirm|submit|type|reply\s+with"
          r"|read\s+out|disclose|fill\s+in|key\s+in|input)")
_OTP_OBJ = (r"(?:otp|o\.t\.p\.?|one[\s-]?time[\s-]?(?:password|pin|passcode|code)|verification\s+code"
            r"|security\s+code|auth(?:entication)?\s+code|login\s+code)")
_CRED_VERBS = _VERBS[:-1] + r"|verify(?:ing)?|validate|update|authenticate|re-?enter)"
_CRED_OBJ = (r"(?:(?<!time[ -])password|passcode|(?<!time[ -])pin(?!\s*code)|upi\s*pin|atm\s*pin|mpin|cvv|cvc"
             r"|card\s+number|card\s+details|(?:debit|credit)\s+card(?:\s+(?:number|details))?|expiry\s+date"
             r"|net\s?banking\s+(?:id|password|details)|login\s+(?:id|details|credentials)"
             r"|aadhaar\s+number|aadhar\s+number|pan\s+number|bank\s+(?:account\s+)?details)")


def _req(obj: str, verbs: str = _VERBS) -> re.Pattern:
    return re.compile(rf"\b(?P<verb>{verbs})\b[^.!?\n]{{0,40}}?\b(?P<obj>{obj})(?![\w])", _I)


OTP_REQ = _req(_OTP_OBJ)
CRED_REQ = _req(_CRED_OBJ, _CRED_VERBS)
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
    put("money_claim_bait", [m for rx in MONEY_CLAIM for m in _all(rx, text)])
    put("click_cta", _all(CLICK_CTA, text) + _all(CLICK_TO_LINK, text))
    put("txn_notice", [m for rx in TXN_NOTICE for m in _all(rx, text)])
    put("bill_pretext", _all(BILL, text))
    put("job_lure", _all(JOB, text))
    put("investment_lure", _all(INVEST, text))
    put("group_invite", _all(GROUP_INVITE, text))

    otp, otp_neg = _requests(OTP_REQ, text)
    put("otp_request", otp)
    cred, cred_neg = _requests(CRED_REQ, text)
    put("credential_request", cred)

    if (otp_neg or _ADVISORY.search(text)) and _OTP_WORD.search(text) and not otp:
        reassurances.append("The message tells you not to share your OTP, as genuine OTP messages do.")
    elif cred_neg and not cred:
        reassurances.append("The message warns you not to share your PIN or password, as genuine messages do.")
    return found, reassurances
