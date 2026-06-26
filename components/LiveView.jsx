'use client'
import FloatingTees from './FloatingTees'
import { playClick } from '../lib/audio'

export default function LiveView({ onEnter }) {
  return (
    <>
      <FloatingTees />
      <div className="live-screen">
        <div className="closed-sub">mogi · drop 0</div>
        <h1 className="live-title">LIVE</h1>
        <div className="closed-sub" style={{ color: 'var(--green)', fontSize: 10 }}>
          20 pieces · hkd 380 each · no restock
        </div>
        <button
          className="btn btn-primary enter-btn"
          onClick={() => { playClick(); onEnter() }}
        >
          ENTER THE DROP
        </button>
      </div>
    </>
  )
}
