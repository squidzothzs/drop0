'use client'
import { useState } from 'react'
import { useStore, StoreProvider } from '../lib/useStore'
import SiteClosedView from '../components/SiteClosedView'
import LiveView from '../components/LiveView'
import MarketplaceView from '../components/MarketplaceView'
import BgMusic from '../components/BgMusic'

function App() {
  const { appState } = useStore().state
  const [entered, setEntered] = useState(false) // per-visitor: passed the LIVE gate

  // status is set from the admin panel and shared across all visitors
  if (appState === 'siteClosed') return <SiteClosedView />

  // 'open' shows the LIVE gate first, then the shop once they enter
  if (appState === 'marketplace' && !entered) return <LiveView onEnter={() => setEntered(true)} />

  // marketplace (entered) + soldOut both render MarketplaceView (soldOut is a sub-state)
  return <MarketplaceView />
}

export default function Page() {
  return (
    <StoreProvider>
      <BgMusic />
      <App />
    </StoreProvider>
  )
}
