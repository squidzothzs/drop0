'use client'
import { useCallback } from 'react'
import { playClick } from '../lib/audio'

export default function ItemCard({ item, onClick }) {
  const { num, status, holder, holderIg, showIg, watchers } = item
  const isSold      = status === 'soldPaid'
  const isClaiming  = status === 'claiming'
  const isUnpaid    = status === 'claimedUnpaid'
  const isAvailable = status === 'available'
  const isTaken     = isUnpaid || isSold

  // who got it — prefer shared IG, fall back to display name
  const claimer = showIg && holderIg ? holderIg : holder

  const handleClick = useCallback(() => {
    if (!isAvailable) return
    playClick()
    onClick(item)
  }, [isAvailable, item, onClick])

  return (
    <div
      className={`item-card${isTaken ? ' card-taken' : ''}`}
      onClick={handleClick}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={isAvailable ? e => e.key === 'Enter' && handleClick() : undefined}
      aria-label={isAvailable ? `Claim MOGI #${num}/20` : `MOGI #${num}/20 — claimed`}
    >
      <div className="card-thumb">
        <div className="card-thumb-3d">
          <div className="card-face card-face-front">
            <img src="/pics/shirtfront-Photoroom.png" alt={`MOGI #${num}/20 front`} loading="lazy" />
          </div>
          <div className="card-face card-face-back">
            <img src="/pics/shirtback-Photoroom2.png" alt={`MOGI #${num}/20 back`} loading="lazy" />
          </div>
        </div>
        {isClaiming && <div className="heat-bubble">someone's claiming…</div>}
        {isTaken && <div className="taken-cross" aria-hidden="true" />}
      </div>

      <div className="card-body">
        <div className="card-badges">
          {isAvailable && <span className="badge badge-avail">UNCLAIMED</span>}
          {isClaiming  && <span className="badge badge-claim">IN PLAY</span>}
          {isUnpaid    && <span className="badge badge-taken">CLAIMING</span>}
          {isSold      && <span className="badge badge-taken">CLAIMED</span>}
        </div>

        <span className="card-name">MOGI #{num} / 20</span>

        {isTaken && (
          claimer
            ? <div className="card-claimer">held by {claimer}</div>
            : <div className="card-claimer">spoken for</div>
        )}

        {watchers > 0 && isClaiming && (
          <div className="card-holder">👁 {watchers} watching</div>
        )}
      </div>
    </div>
  )
}
