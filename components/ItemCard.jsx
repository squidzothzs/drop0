'use client'
import { useCallback } from 'react'
import { playClick } from '../lib/audio'

export default function ItemCard({ item, onClick }) {
  const { num, status, holder, holderIg, showIg, watchers } = item
  const isSold      = status === 'soldPaid'
  const isClaiming  = status === 'claiming'
  const isUnpaid    = status === 'claimedUnpaid'
  const isAvailable = status === 'available'

  const handleClick = useCallback(() => {
    if (!isAvailable) return
    playClick()
    onClick(item)
  }, [isAvailable, item, onClick])

  return (
    <div
      className={`item-card ${isSold ? 'card-sold' : ''}`}
      onClick={handleClick}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={isAvailable ? e => e.key === 'Enter' && handleClick() : undefined}
      aria-label={isAvailable ? `Claim MOGI #${num}/20` : `MOGI #${num}/20 — ${status}`}
    >
      {/* Thumbnail — 3D front/back spin on hover */}
      <div className="card-thumb">
        <span className="card-thumb-num">{num}</span>

        <div className="card-thumb-3d">
          <div className="card-face card-face-front">
            <img src="/pics/shirtfront.jfif" alt={`MOGI #${num}/20 shirt front`} loading="lazy" />
          </div>
          <div className="card-face card-face-back">
            <img src="/pics/shirtback.jfif" alt={`MOGI #${num}/20 shirt back`} loading="lazy" />
          </div>
        </div>

        {isClaiming && (
          <div className="heat-bubble">someone is claiming…</div>
        )}

        {isSold && (
          <div className="sold-x" aria-hidden="true">✕</div>
        )}
      </div>

      {/* Body */}
      <div className="card-body">
        <span className="card-name">MOGI #{num}/20</span>
        <div className="card-sub">Drop 0 · heavyweight</div>
        <div className="card-price">HKD 380</div>

        {isUnpaid && (
          <>
            <div className="card-stamp stamp-claiming">CLAIMING</div>
            <div className="card-holder">
              {holder}
              {showIg && holderIg && (
                <span style={{ color: 'var(--grey)', fontWeight: 'normal' }}> · {holderIg}</span>
              )}
            </div>
            {watchers > 0 && (
              <div className="card-watchers">👁 {watchers} watching</div>
            )}
          </>
        )}

        {isSold && (
          <>
            <div className="card-stamp stamp-sold">OUT OF STOCK</div>
            {holder && (
              <div className="card-holder" style={{ color: 'var(--grey)' }}>{holder}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
