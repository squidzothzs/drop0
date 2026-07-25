'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../lib/useStore'
import { playSuccess, playClick, playOpen } from '../lib/audio'
import { initialStep, holdsReservation } from '../lib/claimStep'

const SIZES = ['S', 'M', 'L', 'XL']
const COUNTDOWN_SECS = 30 * 60  // 30 minutes

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ClaimModal({ item, onClose }) {
  const { startClaim, confirmClaim, releaseClaim, state } = useStore()
  const held = state.myClaims[item.id]
  const heldNum = state.items.find(i => i.id === state.heldPieceId)?.num
  const [step, setStep] = useState(() => initialStep(item.status, held))  // 1 | 2 | 3 | 4
  const [showBack, setShowBack] = useState(false)
  const [name, setName] = useState('')
  const [size, setSize] = useState('M')
  const [ig, setIg] = useState('')
  const [showIg, setShowIg] = useState(false) // default anonymous; tick to show IG
  // resume the real countdown on reopen — `at` is when the reservation started
  const [remaining, setRemaining] = useState(() =>
    held?.at ? Math.max(0, COUNTDOWN_SECS - Math.floor((Date.now() - held.at) / 1000)) : COUNTDOWN_SECS
  )
  const [expired, setExpired] = useState(false)
  const [gone, setGone] = useState(false)   // someone claimed it first
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false) // already holding another piece
  const [failed, setFailed] = useState('')      // the claim errored — not the same as taken
  // a stored token alone must not count — a stale one would skip claim_piece entirely
  const [reserved, setReserved] = useState(() => holdsReservation(item.status, held))
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  // what the buyer pastes into the settle DM so admin can match the claim
  const orderLine = `MOGI drop 0 · piece #${item.num} · size ${size} · ${name.trim()}`
  const copyOrderLine = useCallback(() => {
    navigator.clipboard?.writeText(orderLine).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }, [orderLine])

  // lock background scroll while the modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // admin marking it paid lands here via realtime — that's what shows the claimed page
  useEffect(() => {
    if (item.status === 'soldPaid' && held) setStep(4)
  }, [item.status, held])

  // start countdown on step 3 (cosmetic — server cron is the real authority)
  useEffect(() => {
    if (step !== 3) return
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          setExpired(true)
          releaseClaim(item.id)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [step, item.id, releaseClaim])

  const handleConfirm = useCallback(async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    const { ok } = await confirmClaim(item.id, { name: name.trim(), ig: ig.trim(), showIg, size })
    setBusy(false)
    if (!ok) { setGone(true); return } // reservation lapsed before confirming
    playSuccess()
    setStep(3)
  }, [name, ig, showIg, size, item.id, confirmClaim, busy])

  const handleClose = useCallback(() => {
    // release only an unconfirmed/expired reservation; a paid-pending claim stays
    if ((step < 3 || expired) && !gone) {
      releaseClaim(item.id)
    }
    onClose()
  }, [step, expired, gone, item.id, releaseClaim, onClose])

  const handleStep1Yes = useCallback(async () => {
    if (busy) return
    if (reserved) { playOpen(); setStep(2); return } // came back — keep the reservation
    setBusy(true)
    const { ok, reason, message } = await startClaim(item.id)
    setBusy(false)
    if (!ok) {
      if (reason === 'holding') setBlocked(true)
      else if (reason === 'error') setFailed(message || 'Something broke on our side.')
      else setGone(true)
      return
    }
    setReserved(true)
    playOpen()
    setStep(2)
  }, [item.id, startClaim, busy, reserved])

  return (
    // once a reservation is held (step ≥ 2), a stray overlay click must not release it — only ✕ closes
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && (gone || blocked || step === 1 || step === 4)) handleClose() }}>
      <div className="claim-card" role="dialog" aria-modal="true" aria-label={`Claim MOGI #${item.num}/20`}>

        <button className="claim-close" onClick={handleClose} aria-label="Close">✕</button>
        {/* on the claimed page the number is struck out and the artwork's arrow points at it */}
        <div className={`claim-eyebrow${step === 4 ? ' claim-eyebrow-claimed' : ''}`}>
          MOGI drop 0 · {step === 4 ? <s>Piece #{item.num}</s> : `Piece #${item.num}`}
        </div>

        {/* 3D shirt — tap to turn. The claimed page is the artwork alone, no tee. */}
        {step !== 4 && (
          <>
            <div className="tee-3d-wrap" onClick={() => setShowBack(b => !b)} title="Tap to turn">
              <div className={`tee-3d${showBack ? ' tee-showing-back' : ''}`}>
                <div className="tee-face">
                  <img src="/pics/shirtfront-Photoroom.png" alt="MOGI Drop 0 shirt — front" />
                </div>
                <div className="tee-face tee-face-back">
                  <img src="/pics/shirtback-Photoroom2.png" alt="MOGI Drop 0 shirt — back" />
                </div>
              </div>
            </div>
            <div className="tee-hint">{showBack ? 'back' : 'front'} · tap to turn</div>
          </>
        )}

        {/* ── GONE — someone claimed it first ── */}
        {gone && (
          <div className="claim-step">
            <h2 className="claim-headline">Gone</h2>
            <p className="claim-body">
              #{item.num} was just taken by someone else. Twenty exist — pick another number while they last.
            </p>
            <button className="claim-btn solid" onClick={() => { playClick(); handleClose() }}>Back to the drop</button>
          </div>
        )}

        {/* ── FAILED — the claim errored; the piece is still there ── */}
        {failed && (
          <div className="claim-step">
            <h2 className="claim-headline">Couldn't reach the drop</h2>
            <p className="claim-body">
              #{item.num} is still available — this one's on us. Try again in a moment.
            </p>
            <p className="claim-body" style={{ opacity: 0.5, fontSize: 12 }}>{failed}</p>
            <button className="claim-btn solid" onClick={() => { playClick(); setFailed('') }}>Try again</button>
          </div>
        )}

        {/* ── BLOCKED — this device already holds an unpaid piece ── */}
        {!failed && blocked && (
          <div className="claim-step">
            <h2 className="claim-headline">One at a time</h2>
            <p className="claim-body">
              You're still holding {heldNum ? `#${heldNum}` : 'another piece'}. Settle that one first —
              once it's marked paid you can claim another.
            </p>
            <button className="claim-btn solid" onClick={() => { playClick(); handleClose() }}>Back to the drop</button>
          </div>
        )}

        {/* ── STEP 1 — THE INVITATION ── */}
        {!gone && !blocked && !failed && step === 1 && (
          <div className="claim-step">
            <h2 className="claim-headline">Piece #{item.num}</h2>
            <div className="claim-price">HKD 380</div>
            <p className="claim-body">
              Only twenty exists, no restock, no reprint, claim before its gone.
            </p>
            <div className="claim-btn-row">
              <button className="claim-btn ghost" onClick={() => { playClick(); handleClose() }}>Not this one</button>
              <button className="claim-btn solid" onClick={handleStep1Yes} disabled={busy}>
                {busy ? 'Claiming…' : `Claim #${item.num}`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — YOUR DETAILS ── */}
        {!gone && !blocked && step === 2 && (
          <div className="claim-step">
            <h2 className="claim-headline">Who holds this piece?</h2>
            <p className="claim-body">
              Your name shows on the public list of the 20 owners. Enter it how you want it seen.
            </p>
            <div className="claim-form">
              <div className="claim-field">
                <label className="claim-label" htmlFor="claim-name">Name *</label>
                <input
                  id="claim-name" className="claim-input" type="text" maxLength={32}
                  placeholder="how the registry remembers you"
                  value={name} onChange={e => setName(e.target.value)} autoFocus
                />
              </div>
              <div className="claim-field">
                <label className="claim-label" htmlFor="claim-size">Size *</label>
                <select id="claim-size" className="claim-input" value={size} onChange={e => setSize(e.target.value)}>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="claim-toggle">
                <input type="checkbox" checked={showIg} onChange={e => setShowIg(e.target.checked)} />
                Show my Instagram on the piece — otherwise it reads “held by anonymous”
              </label>
              {showIg && (
                <div className="claim-field">
                  <label className="claim-label" htmlFor="claim-ig">Instagram</label>
                  <input
                    id="claim-ig" className="claim-input" type="text" maxLength={32}
                    placeholder="@handle"
                    value={ig} onChange={e => setIg(e.target.value)} autoFocus
                  />
                </div>
              )}
              <div className="claim-btn-row" style={{ marginTop: 4 }}>
                <button className="claim-btn ghost" onClick={() => { playClick(); setStep(1) }} disabled={busy}>← Back</button>
                <button
                  className="claim-btn solid"
                  onClick={handleConfirm}
                  disabled={!name.trim() || busy}
                  style={{ opacity: name.trim() && !busy ? 1 : 0.45 }}
                >
                  {busy ? 'Locking in…' : `Lock in #${item.num}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 — IT'S YOURS ── */}
        {!blocked && step === 3 && (
          <div className="claim-step">
            {expired ? (
              <>
                <h2 className="claim-headline">Released</h2>
                <p className="claim-body">
                  Your window closed. #{item.num} is back on the floor for someone else to take.
                </p>
                <button
                  className="claim-btn solid"
                  onClick={() => { setStep(1); setExpired(false); setRemaining(COUNTDOWN_SECS) }}
                >
                  Try for it again
                </button>
              </>
            ) : (
              <>
                <div className="claim-eyebrow" style={{ marginBottom: 0 }}>this number is now yours</div>
                <div className="claim-edition">#{item.num}<span>/20</span></div>
                <div className="claim-count">{fmt(remaining)}</div>
                <p className="claim-body" style={{ textAlign: 'center' }}>
                  Settle within thirty minutes or it returns to the floor. Keep this tab open.
                </p>
                <button className="claim-order-line" onClick={copyOrderLine} type="button">
                  {orderLine}
                  <span>{copied ? 'copied ✓' : 'tap to copy · paste it in the DM'}</span>
                </button>
                <a
                  className="claim-btn solid"
                  href="https://www.instagram.com/mogi.exists/"
                  target="_blank" rel="noopener noreferrer"
                  style={{ textAlign: 'center', textDecoration: 'none' }}
                  onClick={playClick}
                >
                  DM @mogi.exists to settle ↗
                </a>
              </>
            )}
          </div>
        )}

        {/* ── STEP 4 — CLAIMED (after they head to the DM) ── */}
        {step === 4 && (
          <img
            className="claim-success-art"
            src="/pics/claimed-success.png"
            alt={`Claimed — piece #${item.num} of 20 is yours`}
            draggable="false"
          />
        )}

      </div>
    </div>
  )
}
