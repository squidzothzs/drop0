'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const S = {
  page: { maxWidth: 720, margin: '0 auto', padding: '32px 16px', fontFamily: 'monospace', color: '#111' },
  h1: { fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 16 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 13 },
  num: { fontWeight: 900, width: 36 },
  tag: { fontSize: 10, padding: '2px 7px', borderRadius: 2, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' },
  btn: { fontFamily: 'monospace', fontSize: 11, padding: '5px 10px', border: '1px solid #111', background: '#111', color: '#fff', cursor: 'pointer' },
  ghost: { fontFamily: 'monospace', fontSize: 11, padding: '5px 10px', border: '1px solid #111', background: '#fff', color: '#111', cursor: 'pointer' },
  input: { fontFamily: 'monospace', fontSize: 14, padding: '10px 12px', border: '1px solid #111', width: '100%', marginBottom: 10 },
  ref: { fontWeight: 900, letterSpacing: '0.08em', border: '1px dashed #bbb', padding: '2px 6px', fontSize: 12 },
  edit: { fontFamily: 'monospace', fontSize: 12, padding: '3px 6px', border: '1px solid #bbb', minWidth: 0 },
}
const TAG_COLOR = { available: '#1d9e5e', claiming: '#d4831f', claimedUnpaid: '#c0392b', soldPaid: '#111' }

const STATUSES = [
  { key: 'closed',  label: 'CLOSED' },
  { key: 'open',    label: 'OPEN' },
  { key: 'soldOut', label: 'SOLD OUT' },
]

// A row for a piece that has buyer details. Same markup for awaiting-payment and
// paid, so it lives here once — `actions` is whatever buttons that section needs.
function PieceRow({ p, onSave, actions }) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({ holder: '', holder_ig: '', size: '' })

  // seed from the row each time it opens, so a cancel-then-reopen shows live values
  const open = () => {
    setF({ holder: p.holder || '', holder_ig: p.holder_ig || '', size: p.size || '' })
    setEditing(true)
  }

  if (!editing) {
    return (
      <div style={S.row}>
        <span style={S.num}>#{p.num}</span>
        <span style={{ ...S.tag, background: TAG_COLOR[p.status] }}>{p.status}</span>
        {/* the code they quote in the DM — match this before marking paid */}
        <span style={S.ref}>{p.ref}</span>
        <span style={{ flex: 1 }}>{p.holder} {p.holder_ig ? `· @${p.holder_ig}` : ''} {p.size ? `· ${p.size}` : ''}</span>
        <button style={S.ghost} onClick={open}>edit</button>
        {actions}
      </div>
    )
  }

  return (
    <div style={{ ...S.row, flexWrap: 'wrap' }}>
      <span style={S.num}>#{p.num}</span>
      <input style={{ ...S.edit, flex: 2 }} placeholder="name"
        value={f.holder} onChange={e => setF({ ...f, holder: e.target.value })} autoFocus />
      <input style={{ ...S.edit, flex: 2 }} placeholder="instagram"
        value={f.holder_ig} onChange={e => setF({ ...f, holder_ig: e.target.value })} />
      <input style={{ ...S.edit, flex: 1 }} placeholder="size"
        value={f.size} onChange={e => setF({ ...f, size: e.target.value })} />
      <button
        style={S.btn}
        disabled={!f.holder.trim()}
        onClick={async () => { await onSave({ id: p.id, ...f }); setEditing(false) }}
      >
        save
      </button>
      <button style={S.ghost} onClick={() => setEditing(false)}>cancel</button>
      {/* a piece claimed anonymously has no public columns to write to, so edits
          here stay private — say so rather than let it look like a bug */}
      <div style={{ flexBasis: '100%', fontSize: 10, opacity: 0.5, paddingTop: 4 }}>
        the @ is optional · shipping record always updates{p.publicName == null && p.publicHandle == null
          ? ' · claimed anonymously, nothing shows on the piece' : ''}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [pieces, setPieces] = useState([])
  const [siteStatus, setSiteStatus] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    // site status is public; buyer PII comes from the password-gated route only
    const { data: cfg } = await supabase.from('site_config').select('status').eq('id', 1).single()
    if (cfg) setSiteStatus(cfg.status)
    if (!password) { setPieces([]); return }
    const res = await fetch('/api/admin/list', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPieces([])
      setMsg(json.error === 'unauthorized' ? 'Wrong password.' : `Load failed: ${json.error || res.status}`)
      return
    }
    setMsg('')
    setPieces(json.pieces || [])
  }, [password])

  // load + realtime so the panel tracks live claims and status changes
  useEffect(() => {
    load()
    const ch = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pieces' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  // remember the password locally so a refresh doesn't lose it
  useEffect(() => { setPassword(sessionStorage.getItem('mogi_admin_pw') || '') }, [])
  useEffect(() => { if (password) sessionStorage.setItem('mogi_admin_pw', password) }, [password])

  const post = useCallback(async (path, body) => {
    setMsg('')
    const res = await fetch(`/api/admin/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setMsg(json.error === 'unauthorized' ? 'Wrong password.' : (json.error || 'Failed.')); return }
    load() // refetch immediately; don't wait on realtime for our own action
  }, [password, load])

  const claiming = pieces.filter(p => p.status === 'claiming')
  const claimed = pieces.filter(p => p.status === 'claimedUnpaid')
  const sold = pieces.filter(p => p.status === 'soldPaid')

  return (
    <div style={S.page}>
      <div style={S.h1}>MOGI · DROP 0 · ADMIN</div>

      <input
        style={S.input} type="password" placeholder="admin password"
        value={password} onChange={e => setPassword(e.target.value)}
      />
      {msg && <div style={{ color: '#c0392b', fontSize: 12, marginBottom: 10 }}>{msg}</div>}

      <div style={{ fontSize: 11, opacity: 0.6, margin: '14px 0 6px', letterSpacing: '0.1em' }}>
        SITE STATUS {siteStatus ? `· now: ${siteStatus.toUpperCase()}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {STATUSES.map(s => {
          const active = siteStatus === s.key
          return (
            <button
              key={s.key}
              style={active ? { ...S.btn, flex: 1 } : { ...S.ghost, flex: 1 }}
              onClick={() => post('set-status', { status: s.key })}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 11, opacity: 0.6, margin: '22px 0 4px', letterSpacing: '0.1em' }}>
        MID-CLAIM ({claiming.length})
      </div>
      {claiming.length === 0 && <div style={{ ...S.row, opacity: 0.5 }}>none</div>}
      {claiming.map(p => (
        <div key={p.id} style={S.row}>
          <span style={S.num}>#{p.num}</span>
          <span style={{ ...S.tag, background: TAG_COLOR[p.status] }}>{p.status}</span>
          <span style={S.ref}>{p.ref}</span>
          {/* no details yet — they're still on the form */}
          <span style={{ flex: 1, opacity: 0.5 }}>form not submitted</span>
          <button style={S.ghost} onClick={() => post('release', { id: p.id })}>release</button>
        </div>
      ))}

      <div style={{ fontSize: 11, opacity: 0.6, margin: '22px 0 4px', letterSpacing: '0.1em' }}>
        AWAITING PAYMENT ({claimed.length})
      </div>
      {claimed.length === 0 && <div style={{ ...S.row, opacity: 0.5 }}>none</div>}
      {claimed.map(p => (
        <PieceRow key={p.id} p={p} onSave={body => post('edit', body)} actions={<>
          <button style={S.btn} onClick={() => post('mark-paid', { id: p.id })}>mark paid</button>
          <button style={S.ghost} onClick={() => post('release', { id: p.id })}>release</button>
        </>} />
      ))}

      <div style={{ fontSize: 11, opacity: 0.6, margin: '22px 0 4px', letterSpacing: '0.1em' }}>
        PAID ({sold.length}/20)
      </div>
      {sold.map(p => (
        <PieceRow key={p.id} p={p} onSave={body => post('edit', body)}
          actions={<button style={S.ghost} onClick={() => post('release', { id: p.id })}>release</button>} />
      ))}
    </div>
  )
}
