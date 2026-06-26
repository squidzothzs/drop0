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

      {/* ── Fixed left mascot column — all 3 images, never scrolls ── */}
      <aside className="mascot-col left" aria-hidden="true">
        <img src="/pics/pic1.png" alt="" draggable="false" />
        <img src="/pics/pic2.png" alt="" draggable="false" />
        <img src="/pics/pic3.png" alt="" draggable="false" />
      </aside>

      {/* ── Fixed right mascot column — all 3 images, never scrolls ── */}
      <aside className="mascot-col right" aria-hidden="true">
        <img src="/pics/pic1.png" alt="" draggable="false" />
        <img src="/pics/pic2.png" alt="" draggable="false" />
        <img src="/pics/pic3.png" alt="" draggable="false" />
      </aside>

      {/* ── Scrollable main content — indented by mascot column width ── */}
      <div className="market-content">

        {/* MOGI banner — scrolls away with the page */}
        <header className="market-drop-header">
          <div className="market-drop-title">MOGI</div>
          <div className="market-drop-sub">Drop 0 · heavyweight · limited to 20</div>
          <div className="market-status">
            {isSoldOut ? (
              <>
                <span className="status-dot grey" />
                <span style={{ color: 'var(--grey)' }}>SOLD OUT · 0 of 20</span>
              </>
            ) : (
              <>
                <span className="status-dot" />
                <span style={{ color: 'var(--heat)' }}>{remainingCount} left of 20</span>
              </>
            )}
          </div>
        </header>

        {/* Product grid */}
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
              fontSize: 11,
              color: 'var(--grey)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              borderTop: '1px solid var(--line)',
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
