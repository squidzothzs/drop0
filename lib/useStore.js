'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

// APP STATES (client-side navigation): siteClosed | live | marketplace | soldOut
// ITEM STATES (from DB):               available | claiming | claimedUnpaid | soldPaid
//
// Items are the shared source of truth in Supabase. This provider loads them
// once, keeps them live via a realtime subscription, and routes claim actions
// through the security-definer RPCs. appState stays per-visitor (navigation).

const StoreCtx = createContext(null)
const TOKEN_KEY = 'mogi_claim_tokens' // localStorage: { [id]: claim_token }

function loadTokens() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}') } catch { return {} }
}
function saveToken(id, token) {
  const t = loadTokens()
  if (token) t[id] = token; else delete t[id]
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
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

  const remainingCount = items.filter(i => i.status === 'available').length
  // null while the status loads — callers show nothing instead of flashing 'closed'
  const appState = siteStatus === null ? null : (STATUS_TO_APP[siteStatus] || 'siteClosed')

  // ── claim actions (async, race-safe via RPC) ──
  const startClaim = useCallback(async (id) => {
    const { data: token, error } = await supabase.rpc('claim_piece', { p_id: id })
    if (error || !token) return { ok: false } // null token = someone beat them to it
    saveToken(id, token)
    return { ok: true }
  }, [])

  const confirmClaim = useCallback(async (id, { name, ig, showIg, size }) => {
    const token = loadTokens()[id]
    if (!token) return { ok: false }
    const { data: ok } = await supabase.rpc('confirm_claim', {
      p_id: id, p_token: token, p_name: name, p_ig: ig, p_show_ig: showIg, p_size: size,
    })
    return { ok: !!ok }
  }, [])

  const releaseClaim = useCallback(async (id) => {
    const token = loadTokens()[id]
    if (!token) return
    await supabase.rpc('release_claim', { p_id: id, p_token: token })
    saveToken(id, null)
  }, [])

  const value = {
    state: { appState, items, remainingCount },
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
