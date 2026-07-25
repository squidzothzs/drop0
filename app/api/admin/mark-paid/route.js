import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// POST { id, password } — flip a piece to soldPaid. Service-role, server-only.
export async function POST(req) {
  const { id, password } = await req.json()
  // ponytail: plain compare — single shared admin password for one founder.
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { error } = await supabaseAdmin
    .from('pieces')
    // paid pieces have no deadline; a leftover one keeps every visitor's clock ticking
    .update({ status: 'soldPaid', claim_expires_at: null })
    .eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
