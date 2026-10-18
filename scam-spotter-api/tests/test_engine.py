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


# ---------------------------------------------------------------- scam-type signatures
TRADEPLUS = ("Name VIP Email Claim: Recd:RS.35,207 Bal: Rs.95,619 Mobile No 91***4006 Country India "
             "Prefered Time 25/Aug Check now: bit.ly/3SPJG9s Tradeplus")


def test_fake_credit_lure_is_high_risk_and_moves_points():
    r = run(TRADEPLUS)
    assert r.level == "high_risk" and r.score >= 60
    pts = {f.rule_id: f.points for f in r.findings}
    # the weak rules gave their points to the signature (moved, not double counted)
    assert pts["shortened_url"] == 0 and pts["click_cta"] == 0
    assert pts["money_claim_bait"] == 20 and pts["sig_fake_credit"] == 15 + 10 + 25
    assert r.raw_score == sum(pts.values()) == r.score
    assert r.category_scores == {"lure": r.score}
    assert [s.id for s in r.signatures] == ["sig_fake_credit"]
    assert next(f for f in r.findings if f.rule_id == "shortened_url").moved_to == "sig_fake_credit"


def test_investment_lure_with_link_is_high_risk():
    r = run("Join our WhatsApp group for guaranteed profit stock tips bit.ly/abc")
    assert r.level == "high_risk" and "sig_investment_lure" in ids(r)


def test_single_weak_rules_never_fire_a_signature():
    for msg in ("Click here to track your order: https://www.amazon.in/track",
                "Rs 5000 credited to A/c XX1234 on 12-Oct. Bal Rs 20000. -SBI",
                "Check this out: bit.ly/abc"):
        r = run(msg)
        assert r.level == "safe" and not r.signatures, msg


def test_groups_are_the_broad_buckets():
    r = run(PDF_SAMPLE)
    assert r.category_scores == {"threat": 15, "pressure": 20, "link": 25, "request": 40}
    assert r.score == 100


# ---------------------------------------------------------------- real scam messages (tests/data)
def _corpus():
    import json, pathlib
    return json.loads((pathlib.Path(__file__).parent / "data" / "scam_corpus.json").read_text(encoding="utf-8"))


def test_every_real_scam_in_the_corpus_is_high_risk():
    bad = [(m[:40], r.score) for m in _corpus() if (r := run(m)).level != "high_risk"]
    assert not bad, bad


def test_fake_notice_with_short_link_moves_points():
    r = run("Dear user A/c 6394314006 received Rs.3875 Balance Rs.5323 Check account details bit.ly/4hUMrQA")
    pts = {f.rule_id: f.points for f in r.findings}
    assert pts["shortened_url"] == 0 and pts["sig_fake_notice"] > 0 and r.level == "high_risk"


def test_job_offer_with_fee_and_utility_and_customs_scams():
    assert "sig_job_fee" in ids(run("Selected for a work-from-home job, salary Rs 45,000/month. "
                                    "Pay a refundable Rs 999 registration fee now."))
    assert "bill_pretext" in ids(run("Your electricity connection will be disconnected tonight due to an unpaid bill."))
    r = run("Pay Rs 45 clearance fee today: https://parcel-customs-fee.track-delivery.in/pay")
    assert "suspicious_link" in ids(r)


def test_upi_pin_verification_is_a_credential_request():
    assert "credential_request" in ids(run("Claim your refund by verifying your UPI PIN"))


NORMAL_MORE = [
    "Rs 5000 credited to A/c XX1234 on 12-Oct. Bal Rs 20000. -SBI",
    "Your Zomato order is out for delivery. Rider will reach in 10 minutes.",
    "Your order #4412 has been shipped. Track it at https://www.amazon.in/track",
    "Your electricity bill of Rs 800 is due on 20 Oct. Thank you.",
    "Dear student, the timetable for semester exams is on the college notice board.",
    "Your OTP is 482913. Do not share it with anyone.",
]


def test_more_normal_messages_stay_safe():
    for m in NORMAL_MORE:
        r = run(m)
        assert r.level == "safe", (m, r.score, [f.rule_id for f in r.findings])


# ---------------------------------------------------------------- dynamic rules & known-scam library
import asyncio as _aio

from app.engine.analyzer import analyze as _analyze
from app.engine.dynamic import DynamicConfig, KeywordRule, Override
from app.engine.matcher import best_match, prepare
from app.engine.normalize import normalize


def run_dyn(msg, dyn, settings=None):
    s = settings or Settings(_env_file=None)

    async def go():
        async with httpx.AsyncClient() as http:
            return await _analyze(sanitize(msg), s, http, dyn=dyn)
    return _aio.run(go())


def test_empty_dynamic_config_matches_code_defaults():
    assert run_dyn(PDF_SAMPLE, DynamicConfig()).score == run(PDF_SAMPLE).score == 100


def test_point_override_changes_score():
    dyn = DynamicConfig(overrides={"otp_request": Override(points=10)})
    r = run_dyn("Please share the OTP you received", dyn)
    assert {f.rule_id: f.points for f in r.findings}["otp_request"] == 10


def test_disabling_a_rule_removes_it():
    base = run_dyn("bit.ly/abc", DynamicConfig())
    assert "shortened_url" in ids(base) and base.score == 15
    dyn = DynamicConfig(disabled=frozenset({"shortened_url"}))
    r = run_dyn("bit.ly/abc", dyn)
    assert "shortened_url" not in ids(r) and r.score == 0


def test_database_keyword_rule_fires():
    kw = KeywordRule(id="kw_test", label="Scam brand", category="bait", group="lure", sub="brand",
                     points=30, why="Seen in scams.", advice="Ignore.", phrases=("tradeplus", "quickcash"))
    r = run_dyn("Greetings from TradePlus", DynamicConfig(keyword_rules=(kw,)))
    pts = {f.rule_id: f.points for f in r.findings}
    assert pts.get("kw_test") == 30 and r.findings[0].group == "lure"


def test_keyword_rule_respects_word_boundary():
    kw = KeywordRule(id="kw_win", label="win", category="bait", group="lure", sub="", points=25,
                     why="", advice="", phrases=("win",), word_boundary=True)
    assert "kw_win" not in ids(run_dyn("The windows are open", DynamicConfig(keyword_rules=(kw,))))
    assert "kw_win" in ids(run_dyn("You win a prize", DynamicConfig(keyword_rules=(kw,))))


def _library():
    corpus = _corpus()
    labels = [f"scam {i}" for i in range(len(corpus))]
    return tuple(prepare(f"s{i}", labels[i], corpus[i]) for i in range(len(corpus)))


def test_known_scam_variant_is_matched_and_high_risk():
    lib = _library()
    variant = ("DearStaff Your account 1112223334 Date:01/01 Time:09:00 received Rs.9999 "
               "Balance Rs.1234 Check account details bit.ly/zzz111 StXavier")
    r = run_dyn(variant, DynamicConfig(known=lib))
    assert r.known_match is not None and r.known_match["ratio"] >= 0.80
    assert "known_scam_match" in ids(r) and r.level == "high_risk"


def test_known_scam_library_does_not_flag_genuine_messages():
    lib = _library()
    for m in NORMAL_MORE + ["Hi, are we still meeting at 5pm today?",
                            "Your appointment with Dr Sharma is confirmed for 20 Oct at 11:00."]:
        r = run_dyn(m, DynamicConfig(known=lib))
        assert r.known_match is None, (m, r.known_match)
        assert r.level == "safe", (m, r.score)


def test_normalizer_strips_variable_parts():
    n = normalize("Recd Rs.35,207 on 25/Aug A/c 91***4006 at bit.ly/abc call 1930")
    assert "<amt>" in n and "<num>" in n and "<date>" in n and "<link>" in n
    assert "35,207" not in n and "bit.ly" not in n
