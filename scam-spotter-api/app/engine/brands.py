"""Brands scammers impersonate, with their OFFICIAL domains.

A link that mentions a brand name but is NOT on one of these domains is treated
as a lookalike. Edit this list freely, and double-check domains before the demo.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Brand:
    name: str
    kind: str                 # bank | wallet | college | govt | delivery | shop
    keywords: tuple[str, ...]  # lowercase tokens that appear in lookalike domains
    domains: tuple[str, ...]   # official registered domains (subdomains are fine)


BRANDS: tuple[Brand, ...] = (
    # Banks
    Brand("SBI", "bank", ("sbi",), ("sbi.co.in", "onlinesbi.sbi", "bank.sbi", "sbicard.com")),
    Brand("HDFC Bank", "bank", ("hdfc", "hdfcbank"), ("hdfcbank.com", "hdfc.com")),
    Brand("ICICI Bank", "bank", ("icici", "icicibank"), ("icicibank.com", "icici.com")),
    Brand("Axis Bank", "bank", ("axisbank",), ("axisbank.com",)),
    Brand("Punjab National Bank", "bank", ("pnb",), ("pnbindia.in", "pnb.co.in")),
    Brand("Kotak Mahindra Bank", "bank", ("kotak",), ("kotak.com",)),
    Brand("Bank of Baroda", "bank", ("bankofbaroda",), ("bankofbaroda.in", "bankofbaroda.com")),
    Brand("Canara Bank", "bank", ("canarabank",), ("canarabank.com",)),
    # Wallets / payments / govt
    Brand("Paytm", "wallet", ("paytm",), ("paytm.com",)),
    Brand("PhonePe", "wallet", ("phonepe",), ("phonepe.com",)),
    Brand("NPCI / UPI", "wallet", ("npci",), ("npci.org.in",)),
    Brand("Income Tax Dept", "govt", ("incometax",), ("incometax.gov.in", "incometaxindia.gov.in")),
    Brand("UIDAI / Aadhaar", "govt", ("uidai",), ("uidai.gov.in",)),
    # Colleges / exams / scholarships
    Brand("Manipal", "college", ("manipal",), ("manipal.edu",)),
    Brand("UGC", "college", ("ugc",), ("ugc.gov.in", "ugc.ac.in")),
    Brand("NTA", "college", ("nta",), ("nta.ac.in", "nta.nic.in")),
    Brand("CBSE", "college", ("cbse",), ("cbse.gov.in", "cbse.nic.in")),
    Brand("National Scholarship Portal", "college", ("nsp",), ("scholarships.gov.in",)),
    # Delivery / shopping
    Brand("Delhivery", "delivery", ("delhivery",), ("delhivery.com",)),
    Brand("India Post", "delivery", ("indiapost",), ("indiapost.gov.in",)),
    Brand("Amazon", "shop", ("amazon",), ("amazon.in", "amazon.com", "amzn.in", "amzn.to", "a.co")),
    Brand("Flipkart", "shop", ("flipkart",), ("flipkart.com", "fkrt.it", "fkrt.cc")),
    Brand("Blue Dart", "delivery", ("bluedart",), ("bluedart.com",)),
    Brand("DTDC", "delivery", ("dtdc",), ("dtdc.com", "dtdc.in")),
    Brand("Ekart", "delivery", ("ekart", "ekartlogistics"), ("ekartlogistics.com",)),
    Brand("FedEx", "delivery", ("fedex",), ("fedex.com",)),
    Brand("DHL", "delivery", ("dhl",), ("dhl.com",)),
)

ALL_OFFICIAL: tuple[str, ...] = tuple(d for b in BRANDS for d in b.domains)
