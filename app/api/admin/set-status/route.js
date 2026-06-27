import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const VALID = ['closed', 'open', 'soldOut']

// POST { status, password } — set the global site status. Service-role, server-only.
export async function POST(req) {
  const { status, password } = await req.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!VALID.includes(status)) {
    return NextResponse.json({ ok: false, error: 'bad status' }, { status: 400 })
  }
  const { error } = await supabaseAdmin
    .from('site_config')
    .update({ status })
    .eq('id', 1)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
