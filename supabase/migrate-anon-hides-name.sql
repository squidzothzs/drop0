-- Run once in the Supabase SQL editor (staging first, then production).
--
-- The claim form's checkbox used to mean "show my Instagram". It now means
-- "don't show my name OR my handle", so p_show_ig has to gate public_name too —
-- otherwise an anonymous piece still prints the buyer's name across the shirt.
-- piece_private is untouched: admin keeps the real name, handle and size.

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
  update public.pieces
     set status = 'claimedUnpaid',
         public_name = case when p_show_ig then p_name else null end,
         public_handle = case when p_show_ig then nullif(p_ig, '') else null end,
         claim_expires_at = now() + interval '30 minutes'
   where id = p_id;
  return true;
end $$;
