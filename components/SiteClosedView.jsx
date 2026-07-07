'use client'
import { useState, useRef, useCallback } from 'react'
import FloatingTees from './FloatingTees'
import { playDeny, playClick } from '../lib/audio'

const CLICKS_TO_BREAK = 4
const BREAK_MS = 1400

export default function SiteClosedView() {
  const [shaking, setShaking] = useState(false)
  const [broken, setBroken] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const clicksRef = useRef(0)
  const shakeTimer = useRef(null)
  const breakTimer = useRef(null)

  const handleEnter = useCallback(() => {
    if (broken) return
    playDeny()
    setShaking(true)
    clearTimeout(shakeTimer.current)
    shakeTimer.current = setTimeout(() => setShaking(false), 420)

    clicksRef.current += 1
    if (clicksRef.current >= CLICKS_TO_BREAK) {
      clicksRef.current = 0
      setBroken(true)
      clearTimeout(breakTimer.current)
      breakTimer.current = setTimeout(() => setBroken(false), BREAK_MS)
    }
  }, [broken])

  return (
    <>
      <div className="closed-bg" aria-hidden="true" />
      <FloatingTees />
      <div className="closed-screen">

        <img
          className="closed-art"
          src="/pics/siteclosed1-crop.png"
          alt="Site is closed"
          draggable="false"
        />

        <div className="closed-btn-row">
          <button
            className={`closed-enter-img ${shaking ? 'shaking' : ''}`}
            onClick={handleEnter}
            aria-label="Enter the drop (closed)"
          >
            <img
              src={broken ? '/pics/buttonbreak-crop.png' : '/pics/prebreakbutton.png'}
              alt=""
              draggable="false"
            />
          </button>

          <button
            className={`lil-guide-btn${guideOpen ? ' open' : ''}`}
            onClick={() => { playClick(); setGuideOpen(o => !o) }}
            aria-expanded={guideOpen}
            aria-label="Lil guide"
          >
            <img src="/pics/lil-guide-button.png" alt="LiL guide" draggable="false" />
          </button>
        </div>

        {guideOpen && (
          <img
            className="closed-guide"
            src="/pics/guide-text.png"
            alt="drop 0 (prequel to drop 1) — unobtainable after sellout — 20 pieces"
            draggable="false"
          />
        )}

      </div>
    </>
  )
}
