// Which page a reopened claim modal lands on.
// held = this browser's stored reservation for the piece ({ token, at }) or undefined.
export function initialStep(status, held) {
  if (!held) return 1
  if (status === 'soldPaid') return 4      // paid — the claimed artwork
  if (status === 'claimedUnpaid') return 3 // details in, still owes payment
  if (status === 'claiming') return 2      // reserved, never filled the form
  return 1                                 // lapsed back to available
}
