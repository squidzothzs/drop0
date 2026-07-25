// The code the buyer quotes in the settle DM so we know which claim is theirs.
//
// It's the first 6 hex of the reservation's claim_token, which claim_piece rolls
// fresh on every claim — so if someone reserves #03 and never pays, the next
// person to take #03 gets a different code for free. No extra column, nothing to
// keep in sync, and no way for two live claims to share a code.
//
// ponytail: derived from the token, so 6 of its 32 hex characters go public. The
// remaining 104 bits keep it unguessable, and the token only ever releases the
// buyer's own piece. Give piece_private its own `ref` column if that ever stops
// being an acceptable trade.
export function claimRef(token) {
  if (!token) return ''
  // hex is already free of the 0/O and 1/I mixups people make reading codes aloud
  return token.replace(/-/g, '').slice(0, 6).toUpperCase()
}
