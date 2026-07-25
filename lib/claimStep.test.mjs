// node lib/claimStep.test.mjs
import assert from 'node:assert/strict'
import { initialStep, holdsReservation, isDeadToken, TOKEN_GRACE_MS } from './claimStep.js'

const held = { token: 'x', at: Date.now() }

// the bug: a claim we just made still reads 'available' locally until realtime lands.
// Pruning it there discarded a LIVE token, and the server then refused every other
// piece on the one-per-device guard — which the UI reported as "Gone".
assert.equal(isDeadToken('available', { token: 'x', at: Date.now() }), false)
assert.equal(isDeadToken('available', { token: 'x', at: Date.now() - TOKEN_GRACE_MS - 1 }), true)
assert.equal(isDeadToken('available', { token: 'x', at: 0 }), true) // legacy/no timestamp
assert.equal(isDeadToken('claiming', { token: 'x', at: 0 }), false) // ours, alive
assert.equal(isDeadToken('soldPaid', { token: 'x', at: 0 }), false) // keeps the claimed page

// not this browser's piece — always the invitation, never someone else's settle page
for (const s of ['available', 'claiming', 'claimedUnpaid', 'soldPaid']) {
  assert.equal(initialStep(s, undefined), 1, `${s} without a token must not resume`)
}

assert.equal(initialStep('soldPaid', held), 4)      // paid -> claimed artwork
assert.equal(initialStep('claimedUnpaid', held), 3) // -> DM to settle
assert.equal(initialStep('claiming', held), 2)      // -> finish the form
assert.equal(initialStep('available', held), 1)     // cron released it -> start over

// a leftover token on a released piece is NOT a reservation — this is the bug where
// #1 and #2 skipped claim_piece and then reported "Gone" on an unclaimed piece
assert.equal(holdsReservation('available', held), false)
assert.equal(holdsReservation('soldPaid', held), false) // paid, nothing left to hold
assert.equal(holdsReservation('claiming', held), true)
assert.equal(holdsReservation('claimedUnpaid', held), true)
assert.equal(holdsReservation('claiming', undefined), false)

console.log('ok')
