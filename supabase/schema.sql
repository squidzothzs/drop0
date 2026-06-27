-- MOGI Drop 0 — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Re-running is safe: it drops and recreates everything.

-- ── table ───────────────────────────────────────────────
drop table if exists public.pieces cascade;

create table public.pieces (
  id          int primary key,
  num         text not null,
  status      text not null default 'available'
              check (status in ('available','claiming','claimedUnpaid','soldPaid')),
  holder      text,
  holder_ig   text,
  show_ig     boolean not null default false,
  size        text,
  claim_token uuid,
  claimed_at  timestamptz
);

-- seed 20 pieces (#01..#20)
insert into public.pieces (id, num)
select g, lpad(g::text, 2, '0')
from generate_series(1, 20) as g;

-- ── row level security ──────────────────────────────────
-- anon may READ everything; all writes go through the SECURITY DEFINER
-- functions below or the service-role key (admin server routes). No direct
-- insert/update/delete policy => anon cannot mutate rows directly.
alter table public.pieces enable row level security;

create policy "pieces are public to read"
  on public.pieces for select
  using (true);

-- ── claim flow functions (atomic, race-safe) ───────────
-- The conditional UPDATE is the lock: it touches exactly one row or zero.

-- reserve an available piece; returns a claim token, or null if already taken
create or replace function public.claim_piece(p_id int)
returns uuid
language plpgsql security definer set search_path = public as $$
declare token uuid := gen_random_uuid();
begin
  update public.pieces
     set status = 'claiming', claim_token = token, claimed_at = now()
   where id = p_id and status = 'available';
  if not found then
    return null;            -- someone beat them to it
  end if;
  return token;
end $$;

-- attach buyer details to a reservation this browser holds
create or replace function public.confirm_claim(
  p_id int, p_token uuid, p_name text, p_ig text, p_show_ig boolean, p_size text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.pieces
     set status = 'claimedUnpaid',
         holder = p_name, holder_ig = nullif(p_ig, ''), show_ig = p_show_ig, size = p_size
   where id = p_id and claim_token = p_token and status = 'claiming';
  return found;
end $$;

-- release a reservation this browser holds (cancel / window closed)
create or replace function public.release_claim(p_id int, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.pieces
     set status = 'available', holder = null, holder_ig = null,
         show_ig = false, size = null, claim_token = null, claimed_at = null
   where id = p_id and claim_token = p_token and status in ('claiming','claimedUnpaid');
  return found;
end $$;

grant execute on function public.claim_piece(int)               to anon, authenticated;
grant execute on function public.confirm_claim(int,uuid,text,text,boolean,text) to anon, authenticated;
grant execute on function public.release_claim(int,uuid)        to anon, authenticated;

-- ── site status (single shared row, admin-controlled) ───
-- closed = "site closed" screen · open = the shop · soldOut = sold-out screen
create table if not exists public.site_config (
  id     int primary key default 1,
  status text not null default 'closed' check (status in ('closed','open','soldOut'))
);
insert into public.site_config (id, status) values (1, 'closed')
  on conflict (id) do nothing;

alter table public.site_config enable row level security;
create policy "site_config public read"
  on public.site_config for select using (true);
-- writes only via the service-role admin route; no anon write policy.

-- ── realtime ────────────────────────────────────────────
-- push row changes to subscribed browsers
alter publication supabase_realtime add table public.pieces;
alter publication supabase_realtime add table public.site_config;

-- ── auto-expiry (pg_cron) ───────────────────────────────
-- Enable the pg_cron extension first: Dashboard → Database → Extensions → pg_cron.
-- Then run the rest of this block.
create extension if not exists pg_cron;

-- unpaid reservations lapse after 30 minutes
select cron.schedule('release-expired-unpaid', '* * * * *', $$
  update public.pieces
     set status='available', holder=null, holder_ig=null,
         show_ig=false, size=null, claim_token=null, claimed_at=null
   where status='claimedUnpaid' and claimed_at < now() - interval '30 minutes';
$$);

-- abandoned 'claiming' (opened modal, walked away) lapse after 5 minutes
select cron.schedule('release-stale-claiming', '* * * * *', $$
  update public.pieces
     set status='available', claim_token=null, claimed_at=null
   where status='claiming' and claimed_at < now() - interval '5 minutes';
$$);
