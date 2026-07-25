// node lib/claimRef.test.mjs
import assert from 'node:assert/strict'
import { claimRef } from './claimRef.js'

assert.equal(claimRef('9f3a1b2c-4d5e-6f70-8192-a3b4c5d6e7f8'), '9F3A1B')
assert.equal(claimRef(null), '')       // no reservation yet
assert.equal(claimRef(undefined), '')  // reopened modal before myClaims loads

// the whole point: piece #03's abandoned claim and its next claimer must not collide.
// claim_piece mints a new uuid each time, so different token => different code.
const a = claimRef('11111111-0000-0000-0000-000000000000')
const b = claimRef('22222222-0000-0000-0000-000000000000')
assert.notEqual(a, b)

// derived only from the token's first 6 hex — the rest never leaves the server
assert.equal(claimRef('abcdef01-2345-6789-abcd-ef0123456789').length, 6)
assert.match(claimRef('abcdef01-2345-6789-abcd-ef0123456789'), /^[0-9A-F]{6}$/)

console.log('ok')
