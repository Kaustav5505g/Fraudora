"""Find links in a message and decide whether each one is official, a lookalike,
a shortener, or just unverified. Pure Python, no network."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlsplit

from .brands import ALL_OFFICIAL, BRANDS, Brand

URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>\"'“”‘’]+", re.I)
BARE_RE = re.compile(
    r"(?<![@\w./-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:/[^\s<>\"'“”‘’]*)?(?![\w@])", re.I)

_TRAIL = ".,;:!?)]}>\"'”’"

SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "ow.ly",
    "tiny.cc", "bit.do", "rebrand.ly", "t.ly", "buff.ly", "s.id", "v.gd", "lnkd.in", "shorte.st",
}
# TLDs we accept for links typed WITHOUT http:// (kept short to avoid matching normal prose)
BARE_TLDS = {
    "com", "in", "org", "net", "co", "info", "io", "edu", "gov", "ac", "biz", "app", "dev", "site",
    "online", "store", "tech", "shop", "xyz", "top", "click", "link", "live", "icu", "buzz", "cfd",
    "sbs", "rest", "work", "support", "vip", "loan", "win", "bid", "monster", "cyou", "tk", "ml",
    "cf", "ga", "gq", "zip", "mov", "example", "test", "invalid", "bank", "sbi", "page", "website",
    "ru", "cn", "pw", "uk", "us", "me",
}
BARE_ONLY_IF_SHORTENER = {"us", "me"}
SUSPICIOUS_TLDS = {
    "xyz", "top", "click", "link", "live", "icu", "buzz", "cfd", "sbs", "rest", "work", "support", "vip",
    "loan", "win", "bid", "monster", "cyou", "tk", "ml", "cf", "ga", "gq", "zip", "mov", "pw",
}
SCAM_WORDS = {"kyc", "verify", "verification", "update", "secure", "login", "refund", "reward", "claim",
              "prize", "bonus", "unblock", "reactivate", "suspended", "alert"}
_SUFFIXES = {"bank", "kyc", "update", "verify", "secure", "login", "online", "care", "support", "alert",
             "card", "pay", "refund", "netbanking", "customer", "service", "help", "india", "app",
             "rewards", "reward", "offer", "offers", "track", "tracking", "parcel", "delivery", "post"}
_LEET_A = str.maketrans({"0": "o", "1": "l", "3": "e", "5": "s", "$": "s", "@": "a"})
_LEET_B = str.maketrans({"0": "o", "1": "i", "3": "e", "5": "s", "$": "s", "@": "a"})
_SECOND_LEVEL = {"co", "com", "org", "net", "gov", "ac", "edu", "nic", "res"}
_IPV4 = re.compile(r"^\d{1,3}(?:\.\d{1,3}){3}$")


@dataclass
class LinkInfo:
    start: int
    end: int
    raw: str
    url: str
    host: str
    status: str = "unverified"   # official | suspicious | shortened | unverified
    reasons: list[str] = field(default_factory=list)
    brand: str | None = None

    @property
    def lookup_eligible(self) -> bool:
        """Worth sending to a reputation service (real, non-official host)."""
        return self.status != "official" and self.host.rsplit(".", 1)[-1] not in {
            "example", "test", "invalid", "localhost", "local"}


def _strip(raw: str) -> str:
    return raw.rstrip(_TRAIL)


def find_links(text: str) -> list[tuple[int, int, str]]:
    spans: list[tuple[int, int, str]] = []
    for m in URL_RE.finditer(text):
        raw = _strip(m.group(0))
        if len(raw) > 4:
            spans.append((m.start(), m.start() + len(raw), raw))
    taken = list(spans)
    for m in BARE_RE.finditer(text):
        raw = _strip(m.group(0))
        s, e = m.start(), m.start() + len(raw)
        if any(s < te and e > ts for ts, te, _ in taken):
            continue
        host = raw.split("/", 1)[0].lower()
        tld = host.rsplit(".", 1)[-1]
        if host not in SHORTENERS:
            if tld not in BARE_TLDS or tld in BARE_ONLY_IF_SHORTENER:
                continue
        spans.append((s, e, raw))
    return sorted(spans)


def registered_domain(host: str) -> str:
    labels = host.split(".")
    if len(labels) >= 3 and len(labels[-1]) == 2 and labels[-2] in _SECOND_LEVEL:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:]) if len(labels) >= 2 else host


def is_official(host: str) -> bool:
    return any(host == d or host.endswith("." + d) for d in ALL_OFFICIAL)


def _tokens(host: str) -> list[str]:
    toks: list[str] = []
    for label in host.split(".")[:-1]:   # drop the TLD
        toks.extend(t for t in label.split("-") if t)
    return toks


def _brand_hit(host: str) -> Brand | None:
    toks = _tokens(host)
    joined = "".join(toks)
    for brand in BRANDS:
        for kw in brand.keywords:
            for tok in toks:
                for v in {tok, tok.translate(_LEET_A), tok.translate(_LEET_B)}:
                    if v == kw:
                        return brand
                    if len(kw) >= 5 and kw in v:
                        return brand
                    if len(kw) < 5 and v.startswith(kw) and v[len(kw):] in _SUFFIXES:
                        return brand
            if len(kw) >= 5 and kw in joined.translate(_LEET_A):
                return brand
    return None


def classify(raw: str, start: int, end: int) -> LinkInfo | None:
    url = raw if re.match(r"https?://", raw, re.I) else "http://" + raw
    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower().rstrip(".")
    except ValueError:
        return None
    if not host or "." not in host:
        return None
    info = LinkInfo(start=start, end=end, raw=raw, url=url, host=host)

    if host in SHORTENERS:
        info.status = "shortened"
        info.reasons.append("Short link: the real destination is hidden.")
        return info

    strong: list[str] = []
    if "@" in parts.netloc:
        strong.append("Hides its real destination behind an '@' sign.")
    if _IPV4.match(host):
        strong.append("Uses a raw IP address instead of a website name.")
    if "xn--" in host or not host.isascii():
        strong.append("The address uses look-alike characters to imitate another site.")

    if is_official(host) and not strong:
        info.status = "official"
        info.reasons.append("Matches an official domain.")
        return info

    brand = _brand_hit(host)
    if brand and not is_official(host):
        info.brand = brand.name
        strong.append(f"Looks like {brand.name} but is not its official website "
                      f"(official: {brand.domains[0]}).")

    tld = host.rsplit(".", 1)[-1]
    toks = _tokens(host)
    if not brand and "-" in host.split(".")[0] and SCAM_WORDS.intersection(toks):
        strong.append("Address stuffs words like 'verify' or 'kyc' into a made-up domain.")

    if strong:
        info.status = "suspicious"
        info.reasons.extend(strong)
        if tld in SUSPICIOUS_TLDS:
            info.reasons.append(f"Uses '.{tld}', an ending common in scam sites.")
    elif tld in SUSPICIOUS_TLDS:
        info.status = "unverified"
        info.reasons.append(f"Uses '.{tld}', an ending common in scam sites. Check it before opening.")
    else:
        info.status = "unverified"
        info.reasons.append("Not a known official website. Could not be verified as genuine.")
    return info


def analyze_links(text: str) -> list[LinkInfo]:
    out = []
    for start, end, raw in find_links(text):
        info = classify(raw, start, end)
        if info:
            out.append(info)
    return out
