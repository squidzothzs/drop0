// node lib/countdown.test.mjs
import assert from 'node:assert/strict'
import { secsLeft, fmt } from './countdown.js'

const now = Date.parse('2026-07-25T12:00:00Z')
const at = (secs) => new Date(now + secs * 1000).toISOString()

// no deadline = no timer on the card; this is what keeps available and paid clean
assert.equal(secsLeft(null, now), null)
assert.equal(secsLeft(undefined, now), null)

assert.equal(secsLeft(at(300), now), 300)  // fresh 'claiming'
assert.equal(secsLeft(at(1800), now), 1800) // fresh 'claimedUnpaid'

// the cron sweeps once a minute, so a card outlives its deadline for a moment —
// it must read 0, never a negative countdown
assert.equal(secsLeft(at(-45), now), 0)

assert.equal(fmt(300), '05:00')
assert.equal(fmt(1800), '30:00')
assert.equal(fmt(9), '00:09')
assert.equal(fmt(0), '00:00')

console.log('ok')
