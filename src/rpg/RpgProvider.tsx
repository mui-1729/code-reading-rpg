import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useProgress } from '../progression/useProgress'
import { getCombatStats } from './combat'
import { RpgContext } from './RpgContext'
import {
  createInitialRpgState,
  restoreRpgState,
  RPG_STORAGE_KEY,
  serializeRpgState,
} from './state'

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

function loadInitialRpgState(baseMaxHp: number) {
  if (typeof window === 'undefined') return createInitialRpgState(baseMaxHp)
  try {
    return restoreRpgState(window.localStorage.getItem(RPG_STORAGE_KEY), baseMaxHp)
  } catch {
    return createInitialRpgState(baseMaxHp)
  }
}

export function RpgProvider({ children }: { children: ReactNode }) {
  const { stats } = useProgress()
  const [rpgState, setRpgState] = useState(() => loadInitialRpgState(stats.maxHp))
  const combatMaxHp = getCombatStats(stats, rpgState).maxHp

  useEffect(() => {
    setRpgState((current) => {
      const nextHp = Math.max(0, Math.min(combatMaxHp, current.currentHp))
      return nextHp === current.currentHp ? current : { ...current, currentHp: nextHp }
    })
  }, [combatMaxHp])

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
    const reset = () => setRpgState(createInitialRpgState(stats.maxHp))
    window.addEventListener(PROGRESS_RESET_EVENT, reset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, reset)
  }, [stats.maxHp])

  const value = useMemo(() => ({ rpgState, setRpgState }), [rpgState])
  return <RpgContext.Provider value={value}>{children}</RpgContext.Provider>
}
