'use client'
import { useState, useCallback } from 'react'
import { useStore } from '../lib/useStore'
import ItemCard from './ItemCard'
import ClaimModal from './ClaimModal'

export default function MarketplaceView() {
  const { state } = useStore()
  const { items, remainingCount, appState, myClaims } = state
  const isSoldOut = appState === 'soldOut'
  // hold the id, not the row: the modal must see realtime status changes
  // (that's how "mark paid" flips an open modal to the claimed page)
  const [activeId, setActiveId] = useState(null)
  const activeItem = items.find(i => i.id === activeId) || null

  const handleCardClick = useCallback((item) => {
    // own pieces reopen at whatever step they left off on
    if (item.status !== 'available' && !myClaims[item.id]) return
    setActiveId(item.id)
  }, [myClaims])

  const handleModalClose = useCallback(() => setActiveId(null), [])

  return (
    <div className="market-root">

      {/* ── Full-screen backdrop behind the shirts ── */}
      <div className="market-inner-bg" aria-hidden="true" />

      {/* ── Scrollable main content ── */}
      <div className="market-content">

        <img className="market-logo" src="/pics/logo-crop.png" alt="MOGI" draggable="false" />

        <div className="market-status-strip">
          <span className={`status-dot${isSoldOut ? ' grey' : ''}`} />
          {isSoldOut
            ? 'SOLD OUT · 0 OF 20'
            : `${remainingCount} LEFT OF 20 · DROP 0`}
        </div>

        <main className="market-grid-wrap">
          <div className="market-grid">
            {items.map(item => (
              <ItemCard key={item.id} item={item} mine={!!myClaims[item.id]} onClick={handleCardClick} />
            ))}
          </div>

          {isSoldOut && (
            <div className="market-soldout-note">
              all 20 pieces are claimed · permanent registry below
            </div>
          )}
        </main>
      </div>

      {activeItem && (
        <ClaimModal item={activeItem} onClose={handleModalClose} />
      )}
    </div>
  )
}
