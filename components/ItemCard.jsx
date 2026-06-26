'use client'
import { useState, useCallback } from 'react'
import { playClick } from '../lib/audio'

export default function ItemCard({ item, onClick }) {
  const { num, status, holder, holderIg, showIg, watchers } = item
  const isSold      = status === 'soldPaid'
  const isClaiming  = status === 'claiming'
  const isUnpaid    = status === 'claimedUnpaid'
  const isAvailable = status === 'available'
  const [flipped, setFlipped] = useState(false)

  const handleClick = useCallback(() => {
    if (!isAvailable) return
    playClick()
    setFlipped(true)
    onClick(item)
  }, [isAvailable, item, onClick])

  return (
    <div
      className={`item-card${isSold ? ' card-sold' : ''}${flipped ? ' card-flipped' : ''}`}
      onClick={handleClick}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={isAvailable ? e => e.key === 'Enter' && handleClick() : undefined}
      aria-label={isAvailable ? `Claim MOGI #${num}/20` : `MOGI #${num}/20 — ${status}`}
    >
      <div className="card-thumb">
        <div className="card-thumb-3d">
          <div className="card-face card-face-front">
            <img src="/pics/shirtfront-Photoroom.png" alt={`MOGI #${num}/20 front`} loading="lazy" />
          </div>
          <div className="card-face card-face-back">
            <img src="/pics/shirtback-Photoroom.png" alt={`MOGI #${num}/20 back`} loading="lazy" />
          </div>
        </div>
        {isClaiming && <div className="heat-bubble">claiming…</div>}
      </div>

      <div className="card-body">
        <div className="card-badges">
          {isAvailable && <span className="badge badge-avail">AVAILABLE</span>}
          {isUnpaid   && <><span className="badge badge-avail">DROP 0</span><span className="badge badge-claim">CLAIMING</span></>}
          {isClaiming && <span className="badge badge-claim">CLAIMING</span>}
          {isSold     && <span className="badge badge-sold">SOLD OUT</span>}
        </div>
        <span className="card-name">MOGI #{num}/20 — Drop 0 Heavyweight</span>
        <div className="card-price">HKD 380</div>
        {holder && (
          <div className="card-holder">{holder}{showIg && holderIg && ` · ${holderIg}`}</div>
        )}
        {watchers > 0 && isUnpaid && (
          <div className="card-holder" style={{ color: 'var(--grey)' }}>👁 {watchers} watching</div>
        )}
      </div>
    </div>
  )
}
