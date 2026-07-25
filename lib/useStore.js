'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import { isDeadToken } from './claimStep'

// APP STATES (client-side navigation): siteClosed | live | marketplace | soldOut
// ITEM STATES (from DB):               available | claiming | claimedUnpaid | soldPaid
//
// Items are the shared source of truth in Supabase. This provider loads them
// once, keeps them live via a realtime subscription, and routes claim actions
// through the security-definer RPCs. appState stays per-visitor (navigation).

const StoreCtx = createContext(null)
const TOKEN_KEY = 'mogi_claim_tokens' // localStorage: { [id]: { token, at } }
const DEVICE_KEY = 'mogi_device'      // random per-browser id, the "one claim at a time" key

function loadTokens() {
  try {
    const raw = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}')
    // entries used to be a bare token string — keep anyone mid-claim working
    return Object.fromEntries(Object.entries(raw).map(
      ([id, v]) => [id, typeof v === 'string' ? { token: v, at: 0 } : v]
    ))
  } catch { return {} }
}
function saveToken(id, token) {
  const t = loadTokens()
  // `at` is when the reservation started, so a reopened modal resumes the real countdown
  if (token) t[id] = { token, at: Date.now() }; else delete t[id]
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
  return t
}
// stable random id for this browser. Not security — a cleared store gets a new one;
// it stops honest double-claiming, and the server re-checks it in claim_piece.
function deviceId() {
  let d = localStorage.getItem(DEVICE_KEY)
  if (!d) { d = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, d) }
  return d
}

// row comes from the public pieces table only — no buyer PII is ever sent here.
// public_handle is the @ the buyer chose to show (null renders as "anonymous").
function rowToItem(row, watchers) {
  return {
    id: row.id,
    num: row.num,
    status: row.status,
    publicHandle: row.public_handle,
    watchers,
  }
}

// DB site status → the view the app renders
const STATUS_TO_APP = { closed: 'siteClosed', open: 'marketplace', soldOut: 'soldOut' }

export function StoreProvider({ children }) {
  const [siteStatus, setSiteStatus] = useState(null) // null = not loaded yet; shared, admin-controlled
  const [items, setItems] = useState([])
  const [myClaims, setMyClaims] = useState({}) // { [id]: { token, at } } — pieces this browser holds
  useEffect(() => { setMyClaims(loadTokens()) }, []) // localStorage is client-only
  const watchersRef = useRef({}) // stable cosmetic random per id (not persisted)

  const watchersFor = useCallback((id) => {
    if (watchersRef.current[id] === undefined) {
      watchersRef.current[id] = Math.floor(Math.random() * 4)
    }
    return watchersRef.current[id]
  }, [])

  // initial load + realtime subscription
  useEffect(() => {
    let active = true
    supabase.from('pieces').select('*').order('id').then(({ data }) => {
      if (active && data) setItems(data.map(r => rowToItem(r, watchersFor(r.id))))
    })

    const channel = supabase
      .channel('pieces-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pieces' }, (payload) => {
        const row = payload.new
        if (!row || row.id == null) return
        setItems(prev => prev.map(it => it.id === row.id ? rowToItem(row, watchersFor(row.id)) : it))
      })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [watchersFor])

  // shared site status — load once + realtime so admin flips reach everyone live
  useEffect(() => {
    let active = true
    supabase.from('site_config').select('status').eq('id', 1).single().then(({ data }) => {
      if (active && data) setSiteStatus(data.status)
    })
    const channel = supabase
      .channel('site-config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, (payload) => {
        if (payload.new?.status) setSiteStatus(payload.new.status)
      })
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  // A piece back at 'available' was released (cron, admin, or a DB reset), so our
  // stored token is dead. Left in place it makes the card claim to be "yours" and
  // makes the modal skip claim_piece, then fail confirm and cry "Gone".
  // The grace period matters: a just-claimed piece is still 'available' here until
  // realtime lands, and pruning it there threw away a live token — which then made
  // the server's one-per-device guard reject every other piece as "Gone".
  // soldPaid entries stay — that's how they reopen the claimed page.
  useEffect(() => {
    if (!items.length) return
    const dead = Object.keys(myClaims).filter(
      id => isDeadToken(items.find(i => String(i.id) === id)?.status, myClaims[id])
    )
    if (!dead.length) return
    let next
    for (const id of dead) next = saveToken(id, null)
    setMyClaims(next)
  }, [items, myClaims])

  const remainingCount = items.filter(i => i.status === 'available').length

  // the one piece this device is mid-claim on. Goes null once it's marked paid
  // (or the cron releases it), which is what frees them to claim another.
  const heldPieceId = items.find(
    i => myClaims[i.id] && (i.status === 'claiming' || i.status === 'claimedUnpaid')
  )?.id ?? null
  // null while the status loads — callers show nothing instead of flashing 'closed'
  const appState = siteStatus === null ? null : (STATUS_TO_APP[siteStatus] || 'siteClosed')

  // ── claim actions (async, race-safe via RPC) ──
  const startClaim = useCallback(async (id) => {
    // server re-checks this, but blocking here gives an instant, honest message
    if (heldPieceId !== null && heldPieceId !== id) return { ok: false, reason: 'holding' }
    const { data: token, error } = await supabase.rpc('claim_piece', {
      p_id: id, p_device: deviceId(),
    })
    // an RPC failure is NOT "someone beat you to it" — saying so for every piece
    // hides a broken deploy behind a plausible lie. Report it as what it is.
    if (error) {
      console.error('claim_piece failed', error)
      return { ok: false, reason: 'error', message: error.message }
    }
    // null token = taken by someone else, OR this device already holds an unpaid piece.
    // Ask which: if the piece is still available, nobody took it — the device guard fired
    // (our localStorage lost the token). Saying "Gone" about an available piece is the lie
    // that made every card look taken.
    if (!token) {
      const { data: row } = await supabase.from('pieces').select('status').eq('id', id).single()
      return { ok: false, reason: row?.status === 'available' ? 'holding' : 'taken' }
    }
    setMyClaims(saveToken(id, token))
    return { ok: true }
  }, [heldPieceId])

  const confirmClaim = useCallback(async (id, { name, ig, showIg, size }) => {
    const held = loadTokens()[id]
    if (!held) return { ok: false }
    const { data: ok } = await supabase.rpc('confirm_claim', {
      p_id: id, p_token: held.token, p_name: name, p_ig: ig, p_show_ig: showIg, p_size: size,
    })
    return { ok: !!ok }
  }, [])

  const releaseClaim = useCallback(async (id) => {
    const held = loadTokens()[id]
    if (!held) return
    await supabase.rpc('release_claim', { p_id: id, p_token: held.token })
    setMyClaims(saveToken(id, null))
  }, [])

  const value = {
    state: { appState, items, remainingCount, myClaims, heldPieceId },
    startClaim,
    confirmClaim,
    releaseClaim,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
