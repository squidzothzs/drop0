'use client'
import { useCallback } from 'react'
import { playClick } from '../lib/audio'
import { secsLeft, fmt } from '../lib/countdown'

// ponytail: hardcoded test map. If borders become a real feature they move to a
// `tier` column on pieces and this goes away.
const TEST_TIERS = { 1: 'rainbow', 2: 'rainbow', 3: 'purple', 4: 'blue' }

export default function ItemCard({ item, mine = false, now, onClick }) {
  const { id, num, status, publicName, publicHandle } = item
  const tier = TEST_TIERS[id]
  const isSold      = status === 'soldPaid'
  const isAvailable = status === 'available'
  const isReserved  = status === 'claiming' || status === 'claimedUnpaid' // unclickable, no cross
  const hasDetails  = status === 'claimedUnpaid' || status === 'soldPaid' // buyer submitted details
  // this browser's own piece stays clickable so they can reopen the settle / claimed page
  const canOpen     = isAvailable || mine

  // shown on the piece: the @ if they opted in, otherwise anonymous.
  // buyers type the handle with or without the @ — normalise so it's never doubled.
  const claimer = publicHandle ? `@${publicHandle.replace(/^@+/, '')}` : 'anonymous'
  // only a live reservation has a deadline, so available and paid pieces show nothing
  const left = secsLeft(item.claimExpiresAt, now)

  const handleClick = useCallback(() => {
    if (!canOpen) return
    playClick()
    onClick(item)
  }, [canOpen, item, onClick])

  return (
    <div
      className={`item-card${isSold ? ' card-sold' : ''}${isReserved ? ' card-reserved' : ''}${mine ? ' card-mine' : ''}${tier ? ` tier-${tier}` : ''}`}
      onClick={handleClick}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onKeyDown={canOpen ? e => e.key === 'Enter' && handleClick() : undefined}
      aria-label={
        mine ? `MOGI #${num}/20 — yours, open it`
        : isAvailable ? `Claim MOGI #${num}/20`
        : `MOGI #${num}/20 — ${isSold ? 'claimed' : 'being claimed'}`
      }
    >
      <div className="card-thumb">
        <div className="card-thumb-3d">
          <div className="card-face card-face-front">
            <img src="/pics/shirtfront-Photoroom.png" alt={`MOGI #${num}/20 front`} loading="lazy" width="400" height="400" />
          </div>
          <div className="card-face card-face-back">
            <img src="/pics/shirtback-Photoroom2.png" alt={`MOGI #${num}/20 back`} loading="lazy" width="400" height="400" />
          </div>
        </div>
        {/* the stamp carries the display name, the line below carries the @handle */}
        {isSold && (
          <div className="taken-stamp" aria-hidden="true">
            held by<br />{publicName || 'anonymous'}
          </div>
        )}
      </div>

      <div className="card-body">
        {/* between the tee and the badge — status-based, so the holder and everyone
            else watch the same clock run down */}
        {left !== null && isReserved && (
          <div className="card-timer">{left > 0 ? `${fmt(left)} left` : 'lapsing…'}</div>
        )}

        <div className="card-badges">
          {isAvailable && <img className="badge-img" src="/pics/badge-unclaimed.png" alt="Unclaimed" draggable="false" />}
          {isReserved  && <img className="badge-img" src="/pics/badge-claiming.png" alt="Claiming" draggable="false" />}
          {isSold      && <img className="badge-img" src="/pics/badge-claimed.png" alt="Claimed" draggable="false" />}
        </div>

        <span className="card-name">MOGI #{num} / 20</span>

        {isAvailable && <div className="card-price">HKD 380</div>}
        {mine && !isAvailable && <div className="card-claimer">yours · tap to open</div>}
        {!mine && isReserved && (
          <div className="card-claimer">{hasDetails ? `held by ${claimer}` : 'being claimed…'}</div>
        )}
        {!mine && isSold && <div className="card-claimer">held by {claimer}</div>}
      </div>
    </div>
  )
}
