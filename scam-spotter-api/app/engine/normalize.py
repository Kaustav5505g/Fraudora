"""Normalise a message for fuzzy comparison against the known-scam library.

Scam SMS variants usually differ only in the amount, account number, date or link.
Replacing those with placeholders lets two variants of the same scam look identical,
so a cheap text-similarity check can match them without a new rule or any AI.
"""
from __future__ import annotations

import re

_LINK = re.compile(r"(?:https?://|www\.)\S+|\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd)/\S+", re.I)
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_AMOUNT = re.compile(r"(?:rs\.?|₹|inr)\s*[\d,]+(?:\.\d+)?", re.I)
_TIME = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\b")
_DATE_NUM = re.compile(r"\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b")
_DATE_MON = re.compile(r"\b(?:\d{1,2}[/\s-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*"
                       r"(?:[\s,/-]*\d{1,4})?\b", re.I)
_MASKED = re.compile(r"\b[\dxX*]{2,}[*xX]+[\dxX*]*\b")   # 91***4006, XX1234
_NUMRUN = re.compile(r"\b\d{3,}\b")                      # account/phone/order numbers
_NUM = re.compile(r"\b\d+\b")


def normalize(text: str) -> str:
    s = text.lower()
    s = _LINK.sub(" <link> ", s)
    s = _EMAIL.sub(" <email> ", s)
    s = _AMOUNT.sub(" <amt> ", s)
    s = _TIME.sub(" <date> ", s)
    s = _DATE_MON.sub(" <date> ", s)
    s = _DATE_NUM.sub(" <date> ", s)
    s = _MASKED.sub(" <num> ", s)
    s = _NUMRUN.sub(" <num> ", s)
    s = _NUM.sub(" <num> ", s)
    s = re.sub(r"[^a-z<>\s]", " ", s)          # drop punctuation, keep placeholder brackets
    s = re.sub(r"\s+", " ", s).strip()
    return s


def tokens(norm: str) -> list[str]:
    return norm.split()
