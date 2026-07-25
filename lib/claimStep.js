// Do we hold a *live* reservation on this piece? Having a stored token is not
// enough — it may be a leftover from a piece the cron or an admin released.
export function holdsReservation(status, held) {
  return !!held && (status === 'claiming' || status === 'claimedUnpaid')
}

// A brand-new claim is 'available' in our local copy until realtime catches up,
// so age is what separates "the cron released this" from "we just claimed it".
export const TOKEN_GRACE_MS = 20000

// Is this stored token a corpse (piece released by cron/admin/reset)?
export function isDeadToken(status, held, now = Date.now()) {
  return status === 'available' && now - (held?.at || 0) > TOKEN_GRACE_MS
}

// Which page a reopened claim modal lands on.
// held = this browser's stored reservation for the piece ({ token, at }) or undefined.
export function initialStep(status, held) {
  if (!held) return 1
  if (status === 'soldPaid') return 4      // paid — the claimed artwork
  if (status === 'claimedUnpaid') return 3 // details in, still owes payment
  if (status === 'claiming') return 2      // reserved, never filled the form
  return 1                                 // lapsed back to available
}
