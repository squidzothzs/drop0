-- Adds pieces.claim_expires_at — the deadline the card countdown ticks down to.
-- Additive only: no drops, existing claims survive. Safe to run twice.
-- Run on BOTH Supabase projects (staging and production).
-- schema.sql already contains all of this for a fresh setup; this file is only
-- for a database that is already live.

alter table public.pieces add column if not exists claim_expires_at timestamptz;

-- backfill anything mid-claim right now, so live reservations get a deadline
-- instead of a blank card
update public.pieces p
   set claim_expires_at = pv.claimed_at
     + case when p.status = 'claiming' then interval '5 minutes'
                                       else interval '30 minutes' end
  from public.piece_private pv
 where pv.piece_id = p.id
   and p.status in ('claiming','claimedUnpaid')
   and p.claim_expires_at is null
   and pv.claimed_at is not null;

-- the three claim functions, now maintaining the deadline
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

  -- 5 minutes to fill the form; must match release-stale-claiming
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

create or replace function public.confirm_claim(
  p_id int, p_token uuid, p_name text, p_ig text, p_show_ig boolean, p_size text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
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
  -- 30 minutes to settle; must match release-expired-unpaid
  update public.pieces
     set status = 'claimedUnpaid',
         public_handle = case when p_show_ig then nullif(p_ig, '') else null end,
         claim_expires_at = now() + interval '30 minutes'
   where id = p_id;
  return true;
end $$;

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
     set status = 'available', public_handle = null, claim_expires_at = null
   where id = p_id;
  update public.piece_private
     set holder = null, holder_ig = null, size = null, phone = null,
         address = null, claim_token = null, claimed_at = null, device_id = null
   where piece_id = p_id;
  return true;
end $$;

-- cron.schedule upserts by job name, so these replace the existing two jobs
select cron.schedule('release-expired-unpaid', '* * * * *', $$
  with expired as (
    select pv.piece_id from public.piece_private pv
    join public.pieces p on p.id = pv.piece_id
    where p.status = 'claimedUnpaid' and pv.claimed_at < now() - interval '30 minutes'
  ), _pub as (
    update public.pieces
       set status = 'available', public_handle = null, claim_expires_at = null
     where id in (select piece_id from expired)
  )
  update public.piece_private
     set holder = null, holder_ig = null, size = null, phone = null,
         address = null, claim_token = null, claimed_at = null, device_id = null
   where piece_id in (select piece_id from expired);
$$);

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
