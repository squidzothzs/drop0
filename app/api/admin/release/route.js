import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// POST { id, password } — force a piece back to available (refund / no-show).
export async function POST(req) {
  const { id, password } = await req.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { error } = await supabaseAdmin
    .from('pieces')
    .update({ status: 'available', public_handle: null })
    .eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  // wipe the buyer's PII from the private table too
  const { error: pErr } = await supabaseAdmin
    .from('piece_private')
    .update({ holder: null, holder_ig: null, size: null, phone: null, address: null, claim_token: null, claimed_at: null })
    .eq('piece_id', id)
  if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
