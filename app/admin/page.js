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
}
const TAG_COLOR = { available: '#1d9e5e', claiming: '#d4831f', claimedUnpaid: '#c0392b', soldPaid: '#111' }

const STATUSES = [
  { key: 'closed',  label: 'CLOSED' },
  { key: 'open',    label: 'OPEN' },
  { key: 'soldOut', label: 'SOLD OUT' },
]

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [pieces, setPieces] = useState([])
  const [siteStatus, setSiteStatus] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('pieces').select('*').order('id')
    if (data) setPieces(data)
    const { data: cfg } = await supabase.from('site_config').select('status').eq('id', 1).single()
    if (cfg) setSiteStatus(cfg.status)
  }, [])

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
        AWAITING PAYMENT ({claimed.length})
      </div>
      {claimed.length === 0 && <div style={{ ...S.row, opacity: 0.5 }}>none</div>}
      {claimed.map(p => (
        <div key={p.id} style={S.row}>
          <span style={S.num}>#{p.num}</span>
          <span style={{ ...S.tag, background: TAG_COLOR[p.status] }}>{p.status}</span>
          <span style={{ flex: 1 }}>{p.holder} {p.holder_ig ? `· ${p.holder_ig}` : ''} {p.size ? `· ${p.size}` : ''}</span>
          <button style={S.btn} onClick={() => post('mark-paid', { id: p.id })}>mark paid</button>
          <button style={S.ghost} onClick={() => post('release', { id: p.id })}>release</button>
        </div>
      ))}

      <div style={{ fontSize: 11, opacity: 0.6, margin: '22px 0 4px', letterSpacing: '0.1em' }}>
        PAID ({sold.length}/20)
      </div>
      {sold.map(p => (
        <div key={p.id} style={S.row}>
          <span style={S.num}>#{p.num}</span>
          <span style={{ ...S.tag, background: TAG_COLOR[p.status] }}>{p.status}</span>
          <span style={{ flex: 1 }}>{p.holder} {p.holder_ig ? `· ${p.holder_ig}` : ''} {p.size ? `· ${p.size}` : ''}</span>
          <button style={S.ghost} onClick={() => post('release', { id: p.id })}>release</button>
        </div>
      ))}
    </div>
  )
}
