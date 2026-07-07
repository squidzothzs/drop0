'use client'
import FloatingTees from './FloatingTees'
import { playClick } from '../lib/audio'

// Shown when the site status is 'open' — the LIVE gate before the shop.
// livetotal.png is the full hand-drawn composition; Hand.png is the same
// canvas with only the hand+ENTER layer, stacked on top so it can move.
export default function LiveView({ onEnter }) {
  return (
    <>
      <FloatingTees />
      <div className="live-screen">
        <div className="live-art">
          <img src="/pics/livetotal.png" alt="LIVE!! — drop 0, 1 & only" draggable="false" />
          <img className="live-hand" src="/pics/Hand.png" alt="" draggable="false" />
          {/* click target = just the hand+ENTER region of the canvas, in % so it scales everywhere */}
          <button
            className="live-hotspot"
            onClick={() => { playClick(); onEnter() }}
            aria-label="Enter the drop"
          />
        </div>
      </div>
    </>
  )
}
