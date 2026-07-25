// node lib/claimStep.test.mjs
import assert from 'node:assert/strict'
import { initialStep } from './claimStep.js'

const held = { token: 'x', at: Date.now() }

// not this browser's piece — always the invitation, never someone else's settle page
for (const s of ['available', 'claiming', 'claimedUnpaid', 'soldPaid']) {
  assert.equal(initialStep(s, undefined), 1, `${s} without a token must not resume`)
}

assert.equal(initialStep('soldPaid', held), 4)      // paid -> claimed artwork
assert.equal(initialStep('claimedUnpaid', held), 3) // -> DM to settle
assert.equal(initialStep('claiming', held), 2)      // -> finish the form
assert.equal(initialStep('available', held), 1)     // cron released it -> start over

console.log('ok')
