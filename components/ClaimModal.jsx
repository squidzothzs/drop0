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
  const [name, setName] = useState('')
  const [size, setSize] = useState('M')
  const [ig, setIg] = useState('')
  const [showIg, setShowIg] = useState(false)
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
      <div className="modal-window" role="dialog" aria-modal="true" aria-label={`Claim MOGI #${item.num}/20`}>

        {/* Win98 title bar */}
        <div className="modal-titlebar">
          <span>MOGI #{item.num}/20 — Claim Window</span>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">

          {/* 3D shirt — hover to flip front → back */}
          <div className="tee-3d-wrap" title="Hover to flip">
            <div className="tee-3d">
              {/* Front face */}
              <div className="tee-face">
                <img src="/pics/shirtfront-Photoroom.png" alt="MOGI Drop 0 shirt — front" />
                <div className="tee-badge">#{item.num}/20 · FRONT</div>
              </div>
              {/* Back face */}
              <div className="tee-face tee-face-back">
                <img src="/pics/shirtback-Photoroom.png" alt="MOGI Drop 0 shirt — back" />
                <div className="tee-badge">BACK · HKD 380</div>
              </div>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="modal-step-label">step 1 of 2 — confirm</div>
              <p className="modal-question">
                Claim #{item.num}/20?<br />
                <span style={{ fontSize: 11, color: 'var(--grey)', fontWeight: 'normal' }}>
                  This reserves your piece. You have 30 minutes to pay via DM.
                </span>
              </p>
              <div className="modal-btn-row">
                <button className="btn" onClick={() => { playClick(); handleClose() }}>Not yet</button>
                <button className="btn btn-primary" onClick={handleStep1Yes}>Yes, claim it</button>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <div className="modal-step-label">step 2 of 2 — your details</div>
              <div className="modal-form">
                <div className="form-field">
                  <label className="form-label" htmlFor="claim-name">Display name *</label>
                  <input
                    id="claim-name"
                    className="form-input"
                    type="text"
                    maxLength={32}
                    placeholder="shown on the registry"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="claim-size">Size *</label>
                  <select
                    id="claim-size"
                    className="form-select"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="claim-ig">Instagram handle</label>
                  <input
                    id="claim-ig"
                    className="form-input"
                    type="text"
                    maxLength={32}
                    placeholder="@handle (optional)"
                    value={ig}
                    onChange={e => setIg(e.target.value)}
                  />
                </div>

                <label className="form-toggle">
                  <input
                    type="checkbox"
                    checked={showIg}
                    onChange={e => setShowIg(e.target.checked)}
                  />
                  Show my IG so people can find me
                </label>

                <div className="modal-btn-row" style={{ marginTop: 4 }}>
                  <button className="btn" onClick={() => { playClick(); setStep(1) }}>← Back</button>
                  <button
                    className="btn btn-gold"
                    onClick={handleConfirm}
                    disabled={!name.trim()}
                    style={{ opacity: name.trim() ? 1 : 0.5 }}
                  >
                    Lock it in
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 (SUCCESS) ── */}
          {step === 3 && (
            <>
              <div className="modal-step-label">
                {expired ? '⚠ time expired — slot released' : 'claimed — pay within 30 minutes'}
              </div>

              {expired ? (
                <p className="modal-question" style={{ color: 'var(--heat)' }}>
                  Your 30 minutes are up.<br />
                  <span style={{ fontSize: 11, fontWeight: 'normal', color: 'var(--grey)' }}>
                    Your claim was released. Tap "Back" to try again.
                  </span>
                </p>
              ) : (
                <div className="success-panel">
                  <div className="success-label">your edition number</div>
                  <div className="success-edition">#{item.num}/20</div>
                  <div className="success-label">time to pay</div>
                  <div className="countdown-box">{fmt(remaining)}</div>
                  <div className="countdown-sub">minutes remaining · do not close this tab</div>
                </div>
              )}

              {!expired && (
                <a
                  className="btn btn-primary"
                  href="https://www.instagram.com/mogi.exists/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
                  onClick={playClick}
                >
                  DM @mogi.exists to pay now ↗
                </a>
              )}

              {expired && (
                <button className="btn" onClick={() => { setStep(1); setExpired(false); setRemaining(COUNTDOWN_SECS) }}>
                  ← Try again
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
