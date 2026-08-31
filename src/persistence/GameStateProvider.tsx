import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { ProgressContext } from '../progression/ProgressContext'
import { createInitialPlayerProgress, getPlayerStats } from '../progression/progression'
import type { PlayerProgress } from '../progression/types'
import { RpgContext } from '../rpg/RpgContext'
import { createInitialRpgState, type RpgState } from '../rpg/state'
import {
  GAME_STATE_STORAGE_KEY,
  parseGameStateSnapshot,
  readGameStateFromStorage,
  writeGameStateToStorage,
} from './gameStateStorage'
import { updateGameProgress, updateGameRpgState, type GameStateStoreState } from './gameStateUpdates'

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

function loadInitialState(): GameStateStoreState {
  if (typeof window === 'undefined') {
    const progress = createInitialPlayerProgress()
    return {
      revision: 0,
      progress,
      rpgState: createInitialRpgState(getPlayerStats(progress.exp).maxHp),
      dirty: false,
    }
  }

  try {
    const snapshot = readGameStateFromStorage(window.localStorage)
    const current = parseGameStateSnapshot(window.localStorage.getItem(GAME_STATE_STORAGE_KEY))
    return {
      ...snapshot,
      // Persist a legacy split save as one atomic snapshot after the first mount.
      dirty: current?.revision !== snapshot.revision,
    }
  } catch {
    const progress = createInitialPlayerProgress()
    return {
      revision: 0,
      progress,
      rpgState: createInitialRpgState(getPlayerStats(progress.exp).maxHp),
      dirty: false,
    }
  }
}

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadInitialState)

  const setProgress = useCallback<Dispatch<SetStateAction<PlayerProgress>>>((action) => {
    setState((current) => updateGameProgress(current, action))
  }, [])

  const setRpgState = useCallback<Dispatch<SetStateAction<RpgState>>>((action) => {
    setState((current) => updateGameRpgState(current, action))
  }, [])

  const resetProgress = useCallback(() => {
    const progress = createInitialPlayerProgress()
    setState((current) => ({
      revision: current.revision,
      progress,
      rpgState: createInitialRpgState(getPlayerStats(progress.exp).maxHp),
      dirty: true,
    }))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PROGRESS_RESET_EVENT))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !state.dirty) return

    try {
      const decision = writeGameStateToStorage(window.localStorage, state)

      // A newer tab won the revision race. Adopt it instead of overwriting it
      // with a snapshot based on stale state.
      if (decision.kind === 'adopt') {
        queueMicrotask(() => setState({ ...decision.snapshot, dirty: false }))
        return
      }

      const committed = decision.snapshot
      queueMicrotask(() => {
        setState((current) =>
          current.progress === state.progress && current.rpgState === state.rpgState
            ? { ...current, revision: committed.revision, dirty: false }
            : { ...current, revision: committed.revision },
        )
      })
    } catch {
      // Storage unavailable: the shared in-memory state remains usable.
    }
  }, [state])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const synchronize = (event: StorageEvent) => {
      if (event.key !== GAME_STATE_STORAGE_KEY && event.key !== null) return
      if (event.newValue === null) {
        setState({
          revision: 0,
          progress: createInitialPlayerProgress(),
          rpgState: createInitialRpgState(),
          dirty: false,
        })
        return
      }
      const incoming = parseGameStateSnapshot(event.newValue)
      if (!incoming) return
      setState((current) =>
        incoming.revision > current.revision ? { ...incoming, dirty: false } : current,
      )
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  const stats = useMemo(() => getPlayerStats(state.progress.exp), [state.progress.exp])
  const progressValue = useMemo(
    () => ({ progress: state.progress, stats, setProgress, resetProgress }),
    [resetProgress, setProgress, state.progress, stats],
  )
  const rpgValue = useMemo(
    () => ({ rpgState: state.rpgState, setRpgState }),
    [setRpgState, state.rpgState],
  )

  return (
    <ProgressContext.Provider value={progressValue}>
      <RpgContext.Provider value={rpgValue}>{children}</RpgContext.Provider>
    </ProgressContext.Provider>
  )
}
