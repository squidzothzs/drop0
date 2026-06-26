'use client'
import { createContext, useContext, useReducer, useCallback } from 'react'

// APP STATES: siteClosed | live | marketplace | soldOut
// ITEM STATES: available | claiming | claimedUnpaid | soldPaid

const ITEMS_TOTAL = 20

function makeItems() {
  return Array.from({ length: ITEMS_TOTAL }, (_, i) => ({
    id: i + 1,
    num: String(i + 1).padStart(2, '0'),
    status: 'available',  // available | claiming | claimedUnpaid | soldPaid
    holder: null,
    holderIg: null,
    showIg: false,
    size: null,
    watchers: Math.floor(Math.random() * 4),
  }))
}

const initialState = {
  appState: 'siteClosed',   // siteClosed | live | marketplace | soldOut
  items: makeItems(),
  remainingCount: ITEMS_TOTAL,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_APP_STATE':
      return { ...state, appState: action.payload }

    case 'START_CLAIM': {
      const items = state.items.map(item =>
        item.id === action.id ? { ...item, status: 'claiming' } : item
      )
      return { ...state, items }
    }

    case 'CONFIRM_CLAIM': {
      const items = state.items.map(item =>
        item.id === action.id
          ? { ...item, status: 'claimedUnpaid', holder: action.holder, holderIg: action.ig, showIg: action.showIg, size: action.size }
          : item
      )
      const remainingCount = items.filter(i => i.status === 'available').length
      return { ...state, items, remainingCount }
    }

    case 'MARK_PAID': {
      const items = state.items.map(item =>
        item.id === action.id ? { ...item, status: 'soldPaid' } : item
      )
      const remainingCount = items.filter(i => i.status === 'available').length
      const appState = remainingCount === 0 ? 'soldOut' : state.appState
      return { ...state, items, remainingCount, appState }
    }

    case 'CANCEL_CLAIM': {
      const items = state.items.map(item =>
        item.id === action.id ? { ...item, status: 'available' } : item
      )
      return { ...state, items }
    }

    case 'RESET':
      return { ...initialState, items: makeItems() }

    default:
      return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
