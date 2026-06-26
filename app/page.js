'use client'
import { useStore, StoreProvider } from '../lib/useStore'
import SiteClosedView from '../components/SiteClosedView'
import LiveView from '../components/LiveView'
import MarketplaceView from '../components/MarketplaceView'

function App() {
  const { state, dispatch } = useStore()
  const { appState } = state

  const goToLive        = () => dispatch({ type: 'SET_APP_STATE', payload: 'live' })
  const goToMarketplace = () => dispatch({ type: 'SET_APP_STATE', payload: 'marketplace' })

  if (appState === 'siteClosed') {
    return <SiteClosedView onEnter={goToLive} />
  }

  if (appState === 'live') {
    return <LiveView onEnter={goToMarketplace} />
  }

  // marketplace + soldOut both render MarketplaceView (soldOut is a sub-state)
  return <MarketplaceView />
}

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  )
}
