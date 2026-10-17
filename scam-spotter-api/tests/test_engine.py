import asyncio

import httpx
import pytest

from app.config import Settings
from app.engine.analyzer import analyze
from app.engine.text import sanitize

PDF_SAMPLE = ("SBI ALERT: Your KYC is incomplete and your account will be blocked today. "
              "Update immediately at http://sbi-kyc-update.example/verify and share the OTP you receive to confirm.")


def run(msg, settings=None, handler=None):
    s = settings or Settings(_env_file=None)

    async def go():
        transport = httpx.MockTransport(handler) if handler else None
        async with httpx.AsyncClient(transport=transport) as http:
            return await analyze(sanitize(msg), s, http)
    return asyncio.run(go())


def ids(r):
    return {f.rule_id for f in r.findings}


# ---------------------------------------------------------------- the PDF example
def test_pdf_sample_is_100_high_risk():
    r = run(PDF_SAMPLE)
    assert (r.score, r.level, r.label) == (100, "high_risk", "High Risk")
    assert {f.rule_id: f.points for f in r.findings} == {
        "fake_urgency": 20, "account_threat": 15, "suspicious_link": 25, "otp_request": 40}
    assert r.headline.startswith("Likely fraud")
    texts = {f.rule_id: [m.text for m in f.matches] for f in r.findings}
    assert texts["fake_urgency"] == ["today", "immediately"]
    assert texts["otp_request"] == ["share the OTP"]
    assert "sbi-kyc-update.example" in texts["suspicious_link"][0]
    assert any("1930" in s for s in r.next_steps)


def test_segments_rebuild_message_and_mark_highlights():
    r = run(PDF_SAMPLE)
    assert "".join(s.text for s in r.segments) == r.message
    marked = {s.text: s.rules for s in r.segments if s.rules}
    assert marked["share the OTP"] == ["otp_request"]
    for f in r.findings:
        for m in f.matches:
            assert r.message[m.start:m.end] == m.text


# ---------------------------------------------------------------- false alarms
@pytest.mark.parametrize("msg", [
    "123456 is your OTP for login. Do not share it with anyone.",
    "Your OTP is 4821. Never share your OTP with anyone, including bank staff.",
    "SBI will never ask you to share your OTP, PIN or password. Stay alert.",
    "All III-year CSE students: Internal Test 2 will be held on 13 Nov 2026 from 10:00 AM to 11:30 AM "
    "in Room 204. Lab records must be submitted to the department office by 12:00 noon on 13 Nov.",
    "Hey, are we still meeting at the library at 5?",
    "Your Amazon order has been delivered. Track it at https://www.amazon.in/gp/your-account/order-history",
    "Check your balance in the SBI app or at https://www.sbi.co.in/web/personal-banking",
])
def test_normal_messages_are_safe(msg):
    r = run(msg)
    assert r.level == "safe", (r.score, [f.label for f in r.findings])
    assert r.score < 30


def test_genuine_otp_has_reassurance():
    r = run("123456 is your OTP for login. Do not share it with anyone.")
    assert r.score == 0 and r.findings == [] and r.reassurances


def test_negation_does_not_hide_a_real_request():
    r = run("Do not ignore this notice; share the OTP now.")
    assert "otp_request" in ids(r)


# ---------------------------------------------------------------- other rules
def test_password_pin_cvv_request():
    assert "credential_request" in ids(run("Please send your card number and CVV to confirm."))
    assert "credential_request" not in ids(run("Please share your pin code for delivery."))


def test_prize_fee_and_shortener_is_high():
    r = run("Congratulations! You have won a lottery prize. Pay a small fee to claim your reward: bit.ly/win123")
    assert {"prize_bait", "payment_fee", "shortened_url"} <= ids(r)
    assert r.level in ("suspicious", "high_risk")


def test_legal_threat_and_urgency():
    r = run("Your SIM is linked to a money laundering case. Arrest warrant is issued. Call immediately.")
    assert {"legal_threat", "fake_urgency"} <= ids(r)


def test_delivery_scam_is_suspicious():
    r = run("Your parcel is on hold. Pay ₹25 to reschedule delivery at bit.ly/xy12")
    assert r.level == "suspicious"
    assert {"delivery_pretext", "payment_fee", "shortened_url"} <= ids(r)


def test_threat_alone_does_not_reach_high():
    r = run("Your account will be suspended. Please complete your KYC.")
    assert r.level == "safe" and r.score == 15


# ---------------------------------------------------------------- links
def test_subdomain_trick_is_not_official():
    r = run("Login at https://sbi.co.in.secure-login.com/")
    assert r.links[0].status == "suspicious"


def test_userinfo_trick():
    r = run("Open https://www.sbi.co.in@evil-site.com/login now")
    assert r.links[0].host == "evil-site.com" and r.links[0].status == "suspicious"


def test_lookalikes_across_brands():
    for url in ["hdfc-bank-login.xyz", "icici-kyc-update.in", "amaz0n-refund.com", "delhivery-parcel.info",
                "indiapost-tracking.top", "manipal-fees.xyz"]:
        r = run(f"Click {url}")
        assert r.links[0].status == "suspicious", url


def test_ip_and_punycode():
    assert run("Go to http://192.168.4.20/login").links[0].status == "suspicious"
    assert run("Go to https://xn--sb-kyc-9xa.com/").links[0].status == "suspicious"


def test_unknown_normal_link_is_only_a_caveat():
    r = run("Hackathon form: https://forms.gle/abc123 and info at https://github.com/org/repo")
    assert r.level == "safe" and r.caveats and all(l.status == "unverified" for l in r.links)


def test_email_addresses_are_not_links():
    assert run("Mail support@sbi.com for help").links == []


def test_only_a_link_caveat():
    r = run("https://example-site.com/page")
    assert any("only a link" in c for c in r.caveats)


# ---------------------------------------------------------------- input handling
def test_obfuscated_keywords_are_normalised():
    assert "otp_request" in ids(run("Please share the O\u200bTP"))
    assert "otp_request" in ids(run("Please share the ＯＴＰ"))


def test_sanitize_strips_control_chars():
    assert sanitize("hi\x00 there\r\n") == "hi there"


# ---------------------------------------------------------------- external services (mocked HTTP)
def _settings(**kw):
    return Settings(_env_file=None, **kw)


def test_safe_browsing_flag_adds_points():
    def handler(req: httpx.Request):
        assert "safebrowsing.googleapis.com" in str(req.url) and req.url.params["key"] == "K"
        url = __import__("json").loads(req.content)["threatInfo"]["threatEntries"][0]["url"]
        return httpx.Response(200, json={"matches": [{"threatType": "SOCIAL_ENGINEERING", "threat": {"url": url}}]})
    r = run("see https://random-site.com/x", _settings(google_safe_browsing_api_key="K"), handler)
    assert "reported_malicious_link" in ids(r) and r.score == 40
    assert r.links[0].status == "reported_dangerous"
    assert r.engine.reputation_checked == ["google_safe_browsing"]


def test_virustotal_flag_and_unknown():
    def handler(req: httpx.Request):
        assert req.headers["x-apikey"] == "V"
        if "bad-site" in __import__("base64").urlsafe_b64decode(str(req.url).rsplit("/", 1)[1] + "==").decode():
            return httpx.Response(200, json={"data": {"attributes": {"last_analysis_stats": {"malicious": 5}}}})
        return httpx.Response(404, json={})
    s = _settings(virustotal_api_key="V")
    assert "reported_malicious_link" in ids(run("open https://bad-site.com/a", s, handler))
    r = run("open https://new-site.com/a", s, handler)
    assert "reported_malicious_link" not in ids(r) and r.links[0].reputation["virustotal"] == "unknown"


def test_reputation_failure_fails_open():
    def handler(req):
        raise httpx.ConnectTimeout("slow")
    r = run("see https://random-site.com/x", _settings(google_safe_browsing_api_key="K"), handler)
    assert r.score == 0 and r.links[0].reputation["google_safe_browsing"] == "error"


def test_official_and_reserved_hosts_are_not_sent_out():
    def handler(req):
        raise AssertionError("no external call expected")
    s = _settings(google_safe_browsing_api_key="K", virustotal_api_key="V")
    run("Visit https://www.sbi.co.in/ or http://sbi-kyc-update.example/verify", s, handler)


def test_gemini_runs_only_when_score_is_high_enough():
    calls = []

    def handler(req: httpx.Request):
        calls.append(str(req.url))
        assert req.headers["x-goog-api-key"] == "G"
        body = __import__("json").loads(req.content)
        assert "untrusted" in body["systemInstruction"]["parts"][0]["text"]
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "Explained."}]}}]})
    s = _settings(gemini_api_key="G")
    r = run(PDF_SAMPLE, s, handler)
    assert r.ai_summary == "Explained." and r.engine.ai_used and r.score == 100
    calls.clear()
    r = run("Your account will be suspended.", s, handler)
    assert r.ai_summary is None and calls == []


def test_gemini_failure_keeps_rule_result():
    def handler(req):
        return httpx.Response(500, json={})
    r = run(PDF_SAMPLE, _settings(gemini_api_key="G"), handler)
    assert r.ai_summary is None and r.level == "high_risk" and r.summary
