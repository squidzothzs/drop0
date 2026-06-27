'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../lib/useStore'
import { playSuccess, playClick, playOpen } from '../lib/audio'

const SIZES = ['S', 'M', 'L', 'XL']
const COUNTDOWN_SECS = 30 * 60  // 30 minutes

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ClaimModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [step, setStep] = useState(1)  // 1 | 2 | 3
  const [showBack, setShowBack] = useState(false)
  const [name, setName] = useState('')
  const [size, setSize] = useState('M')
  const [ig, setIg] = useState('')
  const [showIg, setShowIg] = useState(true)
  const [remaining, setRemaining] = useState(COUNTDOWN_SECS)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef(null)

  // start countdown on step 3
  useEffect(() => {
    if (step !== 3) return
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          setExpired(true)
          dispatch({ type: 'CANCEL_CLAIM', id: item.id })
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [step, item.id, dispatch])

  const handleConfirm = useCallback(() => {
    if (!name.trim()) return
    playSuccess()
    dispatch({
      type: 'CONFIRM_CLAIM',
      id: item.id,
      holder: name.trim(),
      ig: ig.trim(),
      showIg,
      size,
    })
    setStep(3)
  }, [name, ig, showIg, size, item.id, dispatch])

  const handleClose = useCallback(() => {
    if (step < 3 || expired) {
      dispatch({ type: 'CANCEL_CLAIM', id: item.id })
    }
    onClose()
  }, [step, expired, item.id, dispatch, onClose])

  const handleStep1Yes = useCallback(() => {
    playOpen()
    dispatch({ type: 'START_CLAIM', id: item.id })
    setStep(2)
  }, [item.id, dispatch])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="claim-card" role="dialog" aria-modal="true" aria-label={`Claim MOGI #${item.num}/20`}>

        <button className="claim-close" onClick={handleClose} aria-label="Close">✕</button>
        <div className="claim-eyebrow">MOGI · DROP 0 · ONE OF TWENTY</div>

        {/* 3D shirt — tap to turn */}
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

        {/* ── STEP 1 — THE INVITATION ── */}
        {step === 1 && (
          <div className="claim-step">
            <h2 className="claim-headline">Piece #{item.num}</h2>
            <p className="claim-body">
              Twenty exist. No restock, no reprint, no second chance.
              Claim this number and it's struck from the drop — permanently, provably yours.
            </p>
            <div className="claim-btn-row">
              <button className="claim-btn ghost" onClick={() => { playClick(); handleClose() }}>Not this one</button>
              <button className="claim-btn solid" onClick={handleStep1Yes}>Claim #{item.num}</button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — YOUR DETAILS ── */}
        {step === 2 && (
          <div className="claim-step">
            <h2 className="claim-headline">Stake your name</h2>
            <p className="claim-body">
              This goes on the permanent registry beneath the drop. Make it count.
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
              <div className="claim-field">
                <label className="claim-label" htmlFor="claim-ig">Instagram</label>
                <input
                  id="claim-ig" className="claim-input" type="text" maxLength={32}
                  placeholder="@handle"
                  value={ig} onChange={e => setIg(e.target.value)}
                />
              </div>
              <label className="claim-toggle">
                <input type="checkbox" checked={showIg} onChange={e => setShowIg(e.target.checked)} />
                Show my @ on the piece so people know who got it
              </label>
              <div className="claim-btn-row" style={{ marginTop: 4 }}>
                <button className="claim-btn ghost" onClick={() => { playClick(); setStep(1) }}>← Back</button>
                <button
                  className="claim-btn solid"
                  onClick={handleConfirm}
                  disabled={!name.trim()}
                  style={{ opacity: name.trim() ? 1 : 0.45 }}
                >
                  Lock in #{item.num}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 — IT'S YOURS ── */}
        {step === 3 && (
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

      </div>
    </div>
  )
}
