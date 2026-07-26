import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { claimRef } from '../../../../lib/claimRef'

// POST { password } — return pieces with buyer PII for fulfillment.
// PII lives in piece_private (no anon access), so it can only be read here,
// behind the admin password, via the service-role key.
export async function POST(req) {
  const { password } = await req.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabaseAdmin
    .from('pieces')
    .select('id, num, status, public_name, public_handle, piece_private(holder, holder_ig, size, phone, address, claim_token)')
    .order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pieces = data.map(p => {
    const pv = Array.isArray(p.piece_private) ? p.piece_private[0] : p.piece_private
    return {
      id: p.id, num: p.num, status: p.status,
      // null on both = they claimed anonymously; the edit row says so
      publicName: p.public_name, publicHandle: p.public_handle,
      holder: pv?.holder, holder_ig: pv?.holder_ig, size: pv?.size,
      phone: pv?.phone, address: pv?.address,
      // the code the buyer quotes in the DM — never the token itself
      ref: claimRef(pv?.claim_token),
    }
  })
  return NextResponse.json({ pieces })
}
