'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import FloatingTees from './FloatingTees'
import { playDeny, playClick } from '../lib/audio'

const CLICKS_TO_BREAK = 4
const BREAK_MS = 1400

// drop timestamp — null shows -- : -- : -- ; set to a Date.parse(...) when the date is known
const DROP_AT = null

// hand-drawn guide pages, in order (there is no p4)
const GUIDE_PAGES = [
  '/pics/guide-p1.png',
  '/pics/guide-p2.png',
  '/pics/guide-p3.png',
  '/pics/guide-p5.png',
  '/pics/guide-p6.png',
  '/pics/guide-p7.png',
]

export default function SiteClosedView() {
  const [shaking, setShaking] = useState(false)
  const [broken, setBroken] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guidePage, setGuidePage] = useState(0)
  const clicksRef = useRef(0)
  const shakeTimer = useRef(null)
  const breakTimer = useRef(null)

  // null until mounted so the server-rendered "--" never mismatches on hydration
  const [msLeft, setMsLeft] = useState(null)
  useEffect(() => {
    if (DROP_AT === null) return // no date yet — msLeft stays null, timer shows --
    const tick = () => setMsLeft(Math.max(0, DROP_AT - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const totalMin = msLeft === null ? null : Math.floor(msLeft / 60000)
  const tDay  = totalMin === null ? '--' : pad(Math.floor(totalMin / 1440))
  const tHour = totalMin === null ? '--' : pad(Math.floor((totalMin % 1440) / 60))
  const tMin  = totalMin === null ? '--' : pad(totalMin % 60)

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

  const openGuide = useCallback(() => {
    playClick()
    setGuidePage(0)
    setGuideOpen(o => !o)
  }, [])

  const nextGuidePage = useCallback(() => {
    playClick()
    setGuidePage(p => {
      if (p + 1 >= GUIDE_PAGES.length) { setGuideOpen(false); return 0 } // last page → close
      return p + 1
    })
  }, [])

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

        <div className="closed-timer" aria-label="Drop countdown">
          <div className="timer-unit"><span>{tDay}</span><em>day</em></div>
          <div className="timer-colon">:</div>
          <div className="timer-unit"><span>{tHour}</span><em>hour</em></div>
          <div className="timer-colon">:</div>
          <div className="timer-unit"><span>{tMin}</span><em>min</em></div>
        </div>

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
            onClick={openGuide}
            aria-expanded={guideOpen}
            aria-label="Lil guide"
          >
            <img src="/pics/lil-guide-button.png" alt="LiL guide" draggable="false" />
          </button>
        </div>

      </div>

      {guideOpen && (
        <div
          className="guide-overlay"
          onClick={e => { if (e.target === e.currentTarget) setGuideOpen(false) }}
        >
          <div className="guide-window">
            <img
              src={GUIDE_PAGES[guidePage]}
              alt={`LiL guide — page ${guidePage + 1} of ${GUIDE_PAGES.length}`}
              draggable="false"
            />
            {/* invisible hotspot over the hand-drawn arrow baked into each page */}
            <button className="guide-next" onClick={nextGuidePage} aria-label="Next page" />
            <button
              className="guide-close"
              onClick={() => { playClick(); setGuideOpen(false) }}
              aria-label="Close guide"
            >
              <img src="/pics/cross-crop.png" alt="" draggable="false" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
