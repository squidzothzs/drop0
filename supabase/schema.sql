-- MOGI Drop 0 — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Re-running is safe: it drops and recreates everything (no real sales yet).
--
-- SECURITY MODEL
--   public.pieces        — world-readable + realtime-broadcast. Holds ONLY what
--                          every visitor may see: status, number, and the @handle
--                          a buyer chose to show (null = "anonymous").
--   public.piece_private — buyer PII + the claim secret. NO anon access, NOT
--                          broadcast. Reached only via the SECURITY DEFINER
--                          functions below or the service-role key (admin routes).
--   This split is why an opted-out buyer's name/handle never leaves the server,
--   and why adding phone/address (to piece_private) can't leak to the public.

-- ── tables ──────────────────────────────────────────────
drop table if exists public.piece_private cascade;
drop table if exists public.pieces cascade;

create table public.pieces (
  id            int primary key,
  num           text not null,
  status        text not null default 'available'
                check (status in ('available','claiming','claimedUnpaid','soldPaid')),
  -- the display name stamped across a claimed piece. Public by design: the claim
  -- form says it goes on the public list of the 20 owners. piece_private.holder
  -- stays the private copy of record.
  public_name   text,
  public_handle text,  -- shown on the piece; set only when the buyer opts in, else null
  -- when this reservation lapses. Public on purpose: it drives the countdown on every
  -- visitor's card, and a deadline says nothing about who is holding the piece.
  claim_expires_at timestamptz
);

create table public.piece_private (
  piece_id    int primary key references public.pieces(id) on delete cascade,
  holder      text,          -- buyer's real name
  holder_ig   text,          -- buyer's IG (stored even when they display as anonymous)
  size        text,
  phone       text,          -- for shipping — never goes in the public table
  address     text,          -- for shipping — never goes in the public table
  claim_token uuid,          -- the buyer's secret for release_claim; must not be public
  claimed_at  timestamptz,
  device_id   text           -- random per-browser id; enforces one live claim per device
);
create index on public.piece_private (device_id);

-- seed 20 pieces (#01..#20) + their private rows
insert into public.pieces (id, num)
select g, lpad(g::text, 2, '0') from generate_series(1, 20) as g;

insert into public.piece_private (piece_id)
select g from generate_series(1, 20) as g;

-- ── row level security ──────────────────────────────────
-- pieces: anon may READ the public columns; no write policy => no direct mutation.
alter table public.pieces enable row level security;
create policy "pieces public read" on public.pieces for select using (true);

-- piece_private: NO policies at all => anon/authenticated cannot select or mutate.
-- Only SECURITY DEFINER functions (run as owner) and the service-role key reach it.
alter table public.piece_private enable row level security;

-- ── claim flow functions (atomic, race-safe) ───────────
-- The conditional UPDATE on pieces is the lock: it touches exactly one row or zero.

-- reserve an available piece; returns a claim token, or null if already taken
-- (or if this device is already holding a piece it hasn't paid for).
-- the old single-arg version must go, or a caller could use it to skip the guard
drop function if exists public.claim_piece(int);

create or replace function public.claim_piece(p_id int, p_device text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare token uuid := gen_random_uuid();
begin
  -- one live claim per device; frees up once the piece is marked soldPaid
  if p_device is not null and exists (
    select 1 from public.piece_private pv
    join public.pieces p on p.id = pv.piece_id
    where pv.device_id = p_device and p.status in ('claiming','claimedUnpaid')
  ) then
    return null;
  end if;

  -- 5 minutes to fill the form; must match release-stale-claiming below
  update public.pieces
     set status = 'claiming', claim_expires_at = now() + interval '5 minutes'
   where id = p_id and status = 'available';
  if not found then
    return null;            -- someone beat them to it
  end if;
  update public.piece_private
     set claim_token = token, claimed_at = now(), device_id = p_device
   where piece_id = p_id;
  return token;
end $$;

-- attach buyer details to a reservation this browser holds
create or replace function public.confirm_claim(
  p_id int, p_token uuid, p_name text, p_ig text, p_show_ig boolean, p_size text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  -- caller must hold the reservation (token in the private table) and it must be live
  if not exists (
    select 1 from public.pieces p
    join public.piece_private pv on pv.piece_id = p.id
    where p.id = p_id and p.status = 'claiming' and pv.claim_token = p_token
  ) then
    return false;
  end if;
  update public.piece_private
     set holder = p_name, holder_ig = nullif(p_ig, ''), size = p_size
   where piece_id = p_id;
  -- 30 minutes to settle; must match release-expired-unpaid below
  update public.pieces
     set status = 'claimedUnpaid',
         -- p_show_ig is the whole public identity now, not just the handle: unticking
         -- "show me" has to hide the name too, or the piece still names them.
         -- piece_private keeps both regardless — that's what admin ships against.
         public_name = case when p_show_ig then p_name else null end,
         public_handle = case when p_show_ig then nullif(p_ig, '') else null end,
         claim_expires_at = now() + interval '30 minutes'
   where id = p_id;
  return true;
end $$;

-- release a reservation this browser holds (cancel / window closed)
create or replace function public.release_claim(p_id int, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.pieces p
    join public.piece_private pv on pv.piece_id = p.id
    where p.id = p_id and pv.claim_token = p_token
      and p.status in ('claiming','claimedUnpaid')
  ) then
    return false;
  end if;
  update public.pieces
     set status = 'available', public_name = null, public_handle = null,
         claim_expires_at = null
   where id = p_id;
  update public.piece_private
     set holder = null, holder_ig = null, size = null, phone = null,
         address = null, claim_token = null, claimed_at = null, device_id = null
   where piece_id = p_id;
  return true;
end $$;

grant execute on function public.claim_piece(int,text)          to anon, authenticated;
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
drop policy if exists "site_config public read" on public.site_config;
create policy "site_config public read"
  on public.site_config for select using (true);
-- writes only via the service-role admin route; no anon write policy.

-- ── realtime ────────────────────────────────────────────
-- push row changes to subscribed browsers. piece_private is deliberately NOT
-- published — its rows must never reach a client.
-- site_config survives a re-run (create-if-not-exists), so it may already be a
-- member — a plain ADD TABLE would abort the rest of this file.
alter publication supabase_realtime add table public.pieces;
do $$ begin
  alter publication supabase_realtime add table public.site_config;
exception when duplicate_object then null; end $$;

-- ── auto-expiry (pg_cron) ───────────────────────────────
-- Enable the pg_cron extension first: Dashboard → Database → Extensions → pg_cron.
create extension if not exists pg_cron;

-- unpaid reservations lapse after 30 minutes
select cron.schedule('release-expired-unpaid', '* * * * *', $$
  with expired as (
    select pv.piece_id from public.piece_private pv
    join public.pieces p on p.id = pv.piece_id
    where p.status = 'claimedUnpaid' and pv.claimed_at < now() - interval '30 minutes'
  ), _pub as (
    update public.pieces
       set status = 'available', public_name = null, public_handle = null,
         claim_expires_at = null
     where id in (select piece_id from expired)
  )
  update public.piece_private
     set holder = null, holder_ig = null, size = null, phone = null,
         address = null, claim_token = null, claimed_at = null, device_id = null
   where piece_id in (select piece_id from expired);
$$);

-- abandoned 'claiming' (opened modal, walked away) lapse after 5 minutes
select cron.schedule('release-stale-claiming', '* * * * *', $$
  with stale as (
    select pv.piece_id from public.piece_private pv
    join public.pieces p on p.id = pv.piece_id
    where p.status = 'claiming' and pv.claimed_at < now() - interval '5 minutes'
  ), _pub as (
    update public.pieces set status = 'available', claim_expires_at = null
     where id in (select piece_id from stale)
  )
  update public.piece_private set claim_token = null, claimed_at = null, device_id = null
   where piece_id in (select piece_id from stale);
$$);
