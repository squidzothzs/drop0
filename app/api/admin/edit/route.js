import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

// POST { id, holder, holder_ig, size, password } — fix a buyer's details after the fact.
// Typos in a handle are the common case; size changes happen over DM.
export async function POST(req) {
  const { id, holder, holder_ig, size, password } = await req.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const name = (holder || '').trim()
  if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
  // stored bare — the @ is added at render time, so keeping one here doubles it
  const ig = (holder_ig || '').trim().replace(/^@+/, '') || null

  // piece_private is the record of truth: it holds what we actually ship against
  const { error } = await supabaseAdmin
    .from('piece_private')
    .update({ holder: name, holder_ig: ig, size: (size || '').trim() || null })
    .eq('piece_id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // The public columns are a mirror, and whether they're filled is the buyer's
  // privacy choice — nothing stores that choice separately, a null IS the choice.
  // So update a public field only where one already exists; editing must never
  // out someone who claimed anonymously.
  const { data: pub } = await supabaseAdmin
    .from('pieces').select('public_name, public_handle').eq('id', id).single()
  const patch = {}
  if (pub?.public_name != null) patch.public_name = name
  if (pub?.public_handle != null) patch.public_handle = ig
  if (Object.keys(patch).length) {
    const { error: e2 } = await supabaseAdmin.from('pieces').update(patch).eq('id', id)
    if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
