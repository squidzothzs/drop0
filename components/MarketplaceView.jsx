'use client'
import { useState, useCallback } from 'react'
import { useStore } from '../lib/useStore'
import ItemCard from './ItemCard'
import ClaimModal from './ClaimModal'

export default function MarketplaceView() {
  const { state } = useStore()
  const { items, remainingCount, appState } = state
  const isSoldOut = appState === 'soldOut'
  const [activeItem, setActiveItem] = useState(null)

  const handleCardClick = useCallback((item) => {
    if (item.status !== 'available') return
    setActiveItem(item)
  }, [])

  const handleModalClose = useCallback(() => setActiveItem(null), [])

  return (
    <div className="market-root">

      {/* ── Full-screen backdrop behind the shirts ── */}
      <div className="market-inner-bg" aria-hidden="true" />

      {/* ── Scrollable main content ── */}
      <div className="market-content">

        <div className="market-page-title">MOGI</div>

        <div className="market-status-strip">
          <span className={`status-dot${isSoldOut ? ' grey' : ''}`} />
          {isSoldOut
            ? 'SOLD OUT · 0 OF 20'
            : `${remainingCount} LEFT OF 20 · DROP 0`}
        </div>

        <main className="market-grid-wrap">
          <div className="market-grid">
            {items.map(item => (
              <ItemCard key={item.id} item={item} onClick={handleCardClick} />
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
