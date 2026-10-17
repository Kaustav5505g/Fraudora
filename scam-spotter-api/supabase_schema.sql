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
