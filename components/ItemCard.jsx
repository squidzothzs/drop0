'use client'
import { useCallback } from 'react'
import { playClick } from '../lib/audio'

export default function ItemCard({ item, onClick }) {
  const { num, status, holder, holderIg, showIg } = item
  const isSold      = status === 'soldPaid'
  const isAvailable = status === 'available'
  const isReserved  = status === 'claiming' || status === 'claimedUnpaid' // unclickable, no cross
  const hasHolder   = !!holder

  // shown on the piece: the @ if they opted in, otherwise anonymous
  const claimer = showIg && holderIg ? holderIg : 'anonymous'

  const handleClick = useCallback(() => {
    if (!isAvailable) return
    playClick()
    onClick(item)
  }, [isAvailable, item, onClick])

  return (
    <div
      className={`item-card${isSold ? ' card-sold' : ''}${isReserved ? ' card-reserved' : ''}`}
      onClick={handleClick}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={isAvailable ? e => e.key === 'Enter' && handleClick() : undefined}
      aria-label={isAvailable ? `Claim MOGI #${num}/20` : `MOGI #${num}/20 — ${isSold ? 'claimed' : 'being claimed'}`}
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
        {isSold && <div className="taken-cross" aria-hidden="true" />}
      </div>

      <div className="card-body">
        <div className="card-badges">
          {isAvailable && <span className="badge badge-avail">UNCLAIMED</span>}
          {isReserved  && <span className="badge badge-claim">CLAIMING</span>}
          {isSold      && <span className="badge badge-sold">CLAIMED</span>}
        </div>

        <span className="card-name">MOGI #{num} / 20</span>

        {isReserved && (
          <div className="card-claimer">{hasHolder ? `held by ${claimer}` : 'being claimed…'}</div>
        )}
        {isSold && <div className="card-claimer">held by {claimer}</div>}
      </div>
    </div>
  )
}
