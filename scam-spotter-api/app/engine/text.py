import unicodedata

# Invisible characters scammers use to break up keywords ("O<zwsp>TP").
# ZWJ/ZWNJ (U+200C/D) are kept: Hindi and other Indic scripts need them.
_INVISIBLE = dict.fromkeys(map(ord, "\u200b\u200e\u200f\u2060\ufeff\u00ad"), None)


def sanitize(raw: str) -> str:
    """Normalise untrusted input. The result is what the engine scans and what
    highlight offsets refer to."""
    s = unicodedata.normalize("NFKC", raw).translate(_INVISIBLE)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = "".join(ch for ch in s if ch in "\n\t" or unicodedata.category(ch) != "Cc")
    return s.strip()
