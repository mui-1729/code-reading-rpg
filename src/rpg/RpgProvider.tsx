import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RpgContext } from './RpgContext'
import {
  createInitialRpgState,
  restoreRpgState,
  RPG_STORAGE_KEY,
  serializeRpgState,
} from './state'

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

function loadInitialRpgState() {
  if (typeof window === 'undefined') return createInitialRpgState()
  try {
    return restoreRpgState(window.localStorage.getItem(RPG_STORAGE_KEY))
  } catch {
    return createInitialRpgState()
  }
}

export function RpgProvider({ children }: { children: ReactNode }) {
  const [rpgState, setRpgState] = useState(loadInitialRpgState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(RPG_STORAGE_KEY, serializeRpgState(rpgState))
    } catch {
      // Keep the in-memory RPG state usable when storage is unavailable.
    }
  }, [rpgState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reset = () => setRpgState(createInitialRpgState())
    window.addEventListener(PROGRESS_RESET_EVENT, reset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, reset)
  }, [])

  const value = useMemo(() => ({ rpgState, setRpgState }), [rpgState])
  return <RpgContext.Provider value={value}>{children}</RpgContext.Provider>
}
