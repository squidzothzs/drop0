'use client'
import { useState, useRef, useCallback } from 'react'
import FloatingTees from './FloatingTees'
import { playDeny } from '../lib/audio'

const TITLE_A = 'SITE CLOSED'
const TITLE_B = 'STILL CLOSED'

const ROTATIONS = ['-25deg','18deg','-40deg','30deg','-15deg','22deg','-35deg','28deg','-20deg','32deg','-12deg']
const ROTATIONS2 = ['-55deg','48deg','-70deg','60deg','-45deg','52deg','-65deg','58deg','-50deg','62deg','-42deg']

export default function SiteClosedView() {
  const [clicks, setClicks] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [redFlash, setRedFlash] = useState(false)
  const [shattering, setShattering] = useState(false)
  const [reformed, setReformed] = useState(false)
  const [titleText, setTitleText] = useState(TITLE_A)
  const timerRef = useRef(null)

  const triggerShake = useCallback(() => {
    setShaking(true)
    setRedFlash(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShaking(false)
      setRedFlash(false)
    }, 420)
  }, [])

  const handleEnter = useCallback(() => {
    playDeny()
    const next = clicks + 1
    setClicks(next)
    triggerShake()

    if (next >= 5) {
      setClicks(0)
      // begin shatter sequence
      setShattering(true)
      setReformed(false)
      setTimeout(() => {
        setShattering(false)
        setTitleText(TITLE_B)
        // small delay then reform
        setTimeout(() => setReformed(true), 80)
        setTimeout(() => setReformed(false), 800)
      }, 700)
    }
  }, [clicks, triggerShake])

  const letters = titleText.split('').map((ch, i) => ({
    ch,
    rot: ROTATIONS[i % ROTATIONS.length],
    rot2: ROTATIONS2[i % ROTATIONS2.length],
    delay: `${i * 0.045}s`,
  }))

  return (
    <>
      <FloatingTees />
      <div className="closed-screen">
        <div className="closed-sub">mogi · drop 0 · limited to 20</div>

        {/* swappable title — replace inner with <img> for graffiti PNG */}
        <h1
          className={`closed-title ${shattering ? 'shattering' : ''} ${reformed ? 'reformed' : ''}`}
          aria-label={titleText}
        >
          {letters.map((l, i) =>
            l.ch === ' '
              ? <span key={i} style={{ display: 'inline-block', width: '0.35em' }} />
              : (
                <span
                  key={`${titleText}-${i}`}
                  className="title-letter"
                  style={{
                    '--rot':  l.rot,
                    '--rot2': l.rot2,
                    '--fall-delay':   shattering ? l.delay : '0s',
                    '--reform-delay': reformed   ? l.delay : '0s',
                  }}
                >
                  {l.ch}
                </span>
              )
          )}
        </h1>

        <div className="enter-btn-wrap">
          <button
            className={`enter-btn ${shaking ? 'shaking' : ''} ${redFlash ? 'red-flash' : ''}`}
            onClick={handleEnter}
            aria-label="Enter site"
          >
            ENTER
          </button>
        </div>

        <div className="closed-sub" style={{ marginTop: 8, fontSize: 9 }}>
          not yet · not yet · not yet · not yet
        </div>
      </div>
    </>
  )
}
