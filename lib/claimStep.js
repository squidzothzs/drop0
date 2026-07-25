// Do we hold a *live* reservation on this piece? Having a stored token is not
// enough — it may be a leftover from a piece the cron or an admin released.
export function holdsReservation(status, held) {
  return !!held && (status === 'claiming' || status === 'claimedUnpaid')
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
