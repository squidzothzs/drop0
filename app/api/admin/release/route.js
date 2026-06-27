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
    .update({
      status: 'available', holder: null, holder_ig: null,
      show_ig: false, size: null, claim_token: null, claimed_at: null,
    })
    .eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
