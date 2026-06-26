'use client'
import { useState, useCallback } from 'react'
import { useStore } from '../lib/useStore'
import ItemCard from './ItemCard'
import ClaimModal from './ClaimModal'

export default function MarketplaceView() {
  const { state, dispatch } = useStore()
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

      {/* ── Floating icons top-right (not a bar) ── */}
      <div className="market-float-icons">
        <svg viewBox="0 0 24 24" aria-label="Account"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <svg viewBox="0 0 24 24" aria-label="Bag"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      </div>

      {/* ── Fixed left mascot column ── */}
      <aside className="mascot-col left" aria-hidden="true">
        <img src="/pics/pic1.png" alt="" draggable="false" />
        <img src="/pics/pic2.png" alt="" draggable="false" />
        <img src="/pics/pic3.png" alt="" draggable="false" />
      </aside>

      {/* ── Fixed right mascot column ── */}
      <aside className="mascot-col right" aria-hidden="true">
        <img src="/pics/pic1.png" alt="" draggable="false" />
        <img src="/pics/pic2.png" alt="" draggable="false" />
        <img src="/pics/pic3.png" alt="" draggable="false" />
      </aside>

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
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--grey)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              borderTop: '1px solid #f0f0f0',
              marginTop: 24,
            }}>
              all 20 pieces are claimed · permanent registry below
            </div>
          )}
        </main>
      </div>

      {/* Dev admin bar */}
      {process.env.NODE_ENV === 'development' && (
        <div className="admin-bar">
          <span>DEV:</span>
          <button onClick={() => {
            const avail = items.find(i => i.status === 'available')
            if (avail) dispatch({ type: 'MARK_PAID', id: avail.id })
          }}>mark next sold</button>
          <button onClick={() => {
            const avail = items.find(i => i.status === 'available')
            if (avail) dispatch({
              type: 'CONFIRM_CLAIM', id: avail.id,
              holder: 'test_user', ig: '@test', showIg: true, size: 'M',
            })
          }}>sim claim</button>
          <button onClick={() => dispatch({ type: 'RESET' })}>reset</button>
          <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{remainingCount}/20 remaining</span>
        </div>
      )}

      {activeItem && (
        <ClaimModal item={activeItem} onClose={handleModalClose} />
      )}
    </div>
  )
}
