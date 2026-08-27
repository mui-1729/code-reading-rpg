import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useProgress } from '../progression/useProgress'
import { getCombatStats } from './combat'
import { RpgContext } from './RpgContext'
import {
  createInitialRpgState,
  restoreRpgState,
  RPG_STORAGE_KEY,
  serializeRpgState,
  type RpgState,
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

function normalizeCurrentHp(
  state: RpgState,
  stats: ReturnType<typeof useProgress>['stats'],
): RpgState {
  const maxHp = getCombatStats(stats, state).maxHp
  const currentHp = Math.max(0, Math.min(maxHp, state.currentHp))
  return currentHp === state.currentHp ? state : { ...state, currentHp }
}

export function RpgProvider({ children }: { children: ReactNode }) {
  const { stats } = useProgress()
  const [storedRpgState, setStoredRpgState] = useState(() => loadInitialRpgState(stats.maxHp))
  const rpgState = useMemo(
    () => normalizeCurrentHp(storedRpgState, stats),
    [stats, storedRpgState],
  )

  const setRpgState = useCallback<Dispatch<SetStateAction<RpgState>>>(
    (action) => {
      setStoredRpgState((storedCurrent) => {
        const current = normalizeCurrentHp(storedCurrent, stats)
        const next = typeof action === 'function' ? action(current) : action
        return normalizeCurrentHp(next, stats)
      })
    },
    [stats],
  )

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
    const reset = () => setStoredRpgState(createInitialRpgState(stats.maxHp))
    window.addEventListener(PROGRESS_RESET_EVENT, reset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, reset)
  }, [stats.maxHp])

  const value = useMemo(() => ({ rpgState, setRpgState }), [rpgState, setRpgState])
  return <RpgContext.Provider value={value}>{children}</RpgContext.Provider>
}
