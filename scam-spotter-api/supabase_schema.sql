-- Run once in Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists public.scans (
  id          uuid primary key,
  client_id   text        not null,              -- anonymous per-browser id (no login)
  created_at  timestamptz not null default now(),
  score       int         not null check (score between 0 and 100),
  level       text        not null check (level in ('safe', 'suspicious', 'high_risk')),
  preview     text,                              -- first ~80 chars (null if STORE_MESSAGE_TEXT=false)
  rule_ids    text[]      not null default '{}', -- which rules fired
  result      jsonb       not null               -- full scan response, for re-opening a past scan
);

create index if not exists scans_client_created_idx
  on public.scans (client_id, created_at desc);

-- Lock the table down: the API uses the server-side secret key, which bypasses RLS.
-- With RLS on and NO policies, the public anon key can read/write nothing.
alter table public.scans enable row level security;

-- ============================================================================
-- Dynamic rules + known-scam library  (added in rules update 3)
-- Safe to run more than once.
-- ============================================================================

-- 1. Rule config: points, labels and on/off for every rule, plus new keyword rules.
--    kind='code'    -> the pattern lives in Python; this row only tunes points/label/enabled.
--    kind='keyword' -> a whole new rule defined by the phrases in scam_rule_keywords.
create table if not exists public.scam_rules (
  id            text primary key,
  label         text not null,
  category      text not null default 'bait',
  group_name    text not null default 'lure',   -- "group" is reserved in SQL
  sub           text not null default '',
  points        int  not null default 10,
  kind          text not null default 'code' check (kind in ('code','keyword')),
  enabled       boolean not null default true,
  word_boundary boolean not null default true,  -- keyword rules: match whole words only
  why           text default '',
  advice        text default '',
  updated_at    timestamptz not null default now()
);

create table if not exists public.scam_rule_keywords (
  id       bigint generated always as identity primary key,
  rule_id  text not null references public.scam_rules(id) on delete cascade,
  phrase   text not null
);
create index if not exists scam_rule_keywords_rule_id_idx on public.scam_rule_keywords(rule_id);

-- 2. Known-scam library: real scams. New messages that are variants of these are matched
--    by similarity (numbers, amounts, dates and links are ignored), with no new rule.
create table if not exists public.known_scams (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  raw_text   text not null,
  enabled    boolean not null default true,
  source     text default 'manual',
  created_at timestamptz not null default now()
);

-- Seed: every current rule, so you can tune points or switch one off from the table editor.
insert into public.scam_rules (id,label,category,group_name,sub,points,kind,enabled,word_boundary,why,advice)
values
  ('fake_urgency','Fake urgency','urgency','pressure','urgency',20,'code',true,true,'Pressure stops people from thinking. Scammers rush you so you act before you check.','Slow down. Real organisations give you time and never demand action within minutes.'),
  ('account_threat','Account threat','threat','threat','account',15,'code',true,true,'Scammers use fear of losing access to your account, SIM or money.','Don''t act on the message. Open the official app or website yourself and check your account.'),
  ('suspicious_link','Suspicious link','link','link','lookalike',25,'code',true,true,'The link is not an official website. It copies a trusted name or hides where it really goes.','Do not click the link.'),
  ('shortened_url','Shortened link','link','link','shortened',15,'code',true,true,'Short links hide the real destination, so you cannot tell where they lead.','Do not open short links in unexpected messages. Ask for the full official address.'),
  ('otp_request','OTP request','otp','request','otp',40,'code',true,true,'A bank, college or courier will never ask you to share an OTP. Anyone who asks is trying to get into your account.','Never share an OTP with anyone.'),
  ('credential_request','Password / PIN / card request','credentials','request','credentials',40,'code',true,true,'Genuine organisations never ask for your password, PIN, CVV or card details by message.','Never share your password, PIN, CVV or card details.'),
  ('prize_bait','Prize or lottery bait','bait','lure','prize',25,'code',true,true,'Surprise prizes, lotteries and refunds are bait to make you click or hand over details.','Ignore the prize or refund claim. You cannot win a contest you never entered.'),
  ('legal_threat','Legal threat','legal','threat','legal',20,'code',true,true,'Threats of arrest or legal action are used to frighten people into paying or obeying.','Real police and courts do not threaten you by message. Do not pay or reply.'),
  ('payment_fee','Request to pay a fee','payment','request','payment',25,'code',true,true,'Scammers ask for small ''fees'' to release a parcel, prize or blocked account. The money goes to them.','Do not pay anything because of this message.'),
  ('delivery_pretext','Delivery problem pretext','delivery','lure','delivery',10,'code',true,true,'Fake ''parcel on hold'' messages are a common way to lure people to fake pages.','Check your order only in the courier''s or shop''s official app.'),
  ('reported_malicious_link','Link reported as dangerous','reputation','link','reported',40,'code',true,true,'Google Safe Browsing or VirusTotal lists this link as malicious.','Do not open the link.'),
  ('money_claim_bait','Money to claim','bait','lure','money_credit',20,'code',true,true,'Messages that say money is waiting for you to ''claim'' are bait. No real money arrives by clicking a link.','Ignore the claim. Check your real balance only in your bank''s official app.'),
  ('click_cta','Pushy ''click now'' instruction','urgency','pressure','call_to_action',10,'code',true,true,'Scam messages tell you to tap a link right away so you do not stop and think.','Do not tap links you were not expecting.'),
  ('investment_lure','Investment or trading lure','bait','lure','trading',25,'code',true,true,'Guaranteed profits, ''VIP'' tips and trading signals are the usual start of investment scams.','No one can guarantee profit. Ignore tips from unknown senders and check SEBI registration.'),
  ('txn_notice','Fake account or order notice','bait','lure','notification',15,'code',true,true,'Scam texts pose as a credit, balance, bill or delivery update, often with a made-up account number.','Check the real balance or order in your bank''s or shop''s own app.'),
  ('bill_pretext','Unpaid bill pretext','bait','lure','utility',20,'code',true,true,'''Your electricity, gas or mobile connection will be cut'' is a common fear trick to get a quick payment.','Check bills only in the provider''s official app or on the paper bill.'),
  ('job_lure','Job or earning offer','bait','lure','job',25,'code',true,true,'Unasked work-from-home jobs and easy-money offers are used to collect ''registration fees'' or personal details.','Real employers do not ask you to pay to get a job. Ignore the offer.'),
  ('group_invite','Invite to a chat group','bait','lure','trading',10,'code',true,true,'Scammers move victims into WhatsApp or Telegram groups where fake ''experts'' push them to pay.','Do not join groups from unknown senders.'),
  ('suspicious_link','Suspicious link','link','link','lookalike',25,'code',true,true,'The link is not an official website. It copies a trusted name or hides where it really goes.','Do not click the link.'),
  ('shortened_url','Shortened link','link','link','shortened',15,'code',true,true,'Short links hide the real destination, so you cannot tell where they lead.','Do not open short links in unexpected messages. Ask for the full official address.'),
  ('reported_malicious_link','Link reported as dangerous','link','link','reported',40,'code',true,true,'Google Safe Browsing or VirusTotal lists this link as malicious.','Do not open the link.')
on conflict (id) do nothing;

-- Seed: the 13 reported scam messages.
insert into public.known_scams (label,raw_text,enabled) values
  ('fake delivery + link','BOND user(6394314006) your order is out for delivery today. Open Track live status Clk bit.ly/4yqHBzr to - Allotment First come First Basis Cont - MSBPL',true),
  ('fake margin-shortage credit','Salesinvoiceofamendedfor Margin Shortage: Rs.573 unpaid. A/c 6394314006 balance Rs.85,006. Please withdraw or pay the due amount: bit.ly/4z9rY0n bySMSBIT',true),
  ('fake salary credit','DearStaff  Your account 6394314006 Date:30/09 Time:12:52 received Rs.3875 Balance Rs.5323 Check account details bit.ly/4hUMrQA StColumbus',true),
  ('fake claim / trading','Name VIP Email Claim: Recd:RS.35,207 Bal: Rs.95,619 Mobile No 91***4006 Country India Prefered Time 25/Aug Check now: bit.ly/3SPJG9s Tradeplus',true),
  ('fake bill-settled credit','DE ARPA RENT Parent Dear Stude A/c 91***006 Your Bill Settled scheduled on Aug 15,13:30 at Received Rs.3323 Bal:Rs.7096 Chec bit.ly/4ql3ePq SREEKASYAPJRCOLLEGE',true),
  ('fake credited alert','Hi! We tried reaching you regarding A/c: (6394314006) Credited: Rs.10340 Avail Bal: Rs.31397, click here: View details bit.ly/4gfqOs7 Date: 20/08 11:18',true),
  ('fake order shipped','Dear account(6394314006), your order Rs.10815 has been Shipped. isABSENT forclasson Thank you for using Click to view bit.ly/3RJAToR SVESKR',true),
  ('fake cab credit','SAFETRAXTripDelayAlertCab X89 your account has been credited Rs5000. of Proceed to withdraw during available times. Lots redeeming! bit.ly/4tNyNC2',true),
  ('UPI refund PIN phish','UPI REFUND: Your payment refund of Rs 4,999 is pending. Claim it now by verifying your UPI PIN: https://upi-refund.claim-secure.in/receive',true),
  ('SBI KYC block phish','VK-SBIINB: Your SBI account will be blocked today due to incomplete KYC. Verify immediately to keep your account active: https://sbi-kyc-update.secure-l0gin.in/verify',true),
  ('electricity disconnection','URGENT: Your electricity connection will be disconnected tonight due to an unpaid bill. Pay immediately to avoid disconnection: https://electricity-bill.pay-now-india.in',true),
  ('parcel customs fee','DELIVERY ALERT: Your parcel is held at customs. Pay Rs 45 clearance fee today to avoid return: https://parcel-customs-fee.track-delivery.in/pay',true),
  ('work-from-home job fee','Congratulations! You are selected for a work-from-home job with salary Rs 45,000/month. Pay a refundable Rs 999 registration fee now to confirm your position.',true)
on conflict do nothing;

-- Example of a NEW keyword rule added without touching code (disabled by default):
-- insert into public.scam_rules (id,label,category,group_name,sub,points,kind,enabled,why,advice)
-- values ('kw_tradeplus','Known scam brand name','bait','lure','brand',30,'keyword',false,
--         'This name appears in reported scams.','Ignore messages from this sender.');
-- insert into public.scam_rule_keywords (rule_id,phrase) values ('kw_tradeplus','tradeplus');
