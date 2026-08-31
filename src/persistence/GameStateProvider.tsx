import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { BattleSessionContext, type BattleSessionContextValue } from '../battle/BattleSessionContext'
import { commitBattleSession, getVisibleBattleState, rollbackBattleSession, startBattleSession, updateBattleSession } from '../battle/sessionTransaction'
import { ProgressContext } from '../progression/ProgressContext'
import { createInitialPlayerProgress, getPlayerStats } from '../progression/progression'
import type { PlayerProgress } from '../progression/types'
import { RpgContext } from '../rpg/RpgContext'
import { createInitialRpgState, type RpgState } from '../rpg/state'
import {
  GAME_STATE_STORAGE_KEY,
  GAME_STATE_SCHEMA_VERSION,
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
    const restored = readGameStateFromStorage(window.localStorage)
    const snapshot = rollbackBattleSession(restored)
    const currentRaw = window.localStorage.getItem(GAME_STATE_STORAGE_KEY)
    const current = parseGameStateSnapshot(currentRaw)
    return {
      ...snapshot,
      // Persist a legacy split save as one atomic snapshot after the first mount.
      dirty: snapshot !== restored || current?.revision !== snapshot.revision ||
        (current !== null && JSON.parse(currentRaw!).version !== GAME_STATE_SCHEMA_VERSION),
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
  const [externalRevision, setExternalRevision] = useState(0)
  const [localSessionId, setLocalSessionId] = useState<string | null>(null)
  const lastWrite = useRef<GameStateStoreState | null>(null)
  const ownCommittedRevision = useRef(0)
  const localBattleId = useRef<string | null>(null)

  const start = useCallback<BattleSessionContextValue['start']>((identity) => {
    localBattleId.current = identity.id
    setLocalSessionId(identity.id)
    setState((current) => {
      const next = startBattleSession(current, identity)
      return next === current ? current : { ...next, dirty: true }
    })
  }, [])
  const update = useCallback<BattleSessionContextValue['update']>((id, action) => {
    setState((current) => updateBattleSession(current, id, (value) => {
      const next = action(value)
      return updateGameRpgState(updateGameProgress(current, next.progress), next.rpgState)
    }))
  }, [])
  const commit = useCallback<BattleSessionContextValue['commit']>((id, event, action) => {
    if (localBattleId.current === id) localBattleId.current = null
    setLocalSessionId((current) => current === id ? null : current)
    setState((current) => {
      const next = commitBattleSession(current, id, event, (value) => {
        const result = action ? action(value) : value
        return updateGameRpgState(updateGameProgress(current, result.progress), result.rpgState)
      })
      return next === current ? current : { ...next, dirty: true }
    })
  }, [])
  const abort = useCallback<BattleSessionContextValue['abort']>((id, mode = 'abort') => {
    if (id === undefined || localBattleId.current === id) localBattleId.current = null
    setLocalSessionId((current) => id === undefined || current === id ? null : current)
    setState((current) => {
      const next = rollbackBattleSession(current, id, mode)
      return next === current ? current : { ...next, dirty: true }
    })
  }, [])

  const setProgress = useCallback<Dispatch<SetStateAction<PlayerProgress>>>((action) => {
    const owner = localBattleId.current
    setState((current) => updateGameProgress(
      current.battleSession && current.battleSession.identity.id !== owner
        ? { ...rollbackBattleSession(current), dirty: true } : current,
      action,
    ))
  }, [])

  const setRpgState = useCallback<Dispatch<SetStateAction<RpgState>>>((action) => {
    const owner = localBattleId.current
    setState((current) => updateGameRpgState(
      current.battleSession && current.battleSession.identity.id !== owner
        ? { ...rollbackBattleSession(current), dirty: true } : current,
      action,
    ))
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
    if (typeof window === 'undefined' || !state.dirty || lastWrite.current === state) return
    lastWrite.current = state

    try {
      // Layout START/ABORT can enqueue another render before the write receipt is
      // reflected in React. Our own preceding commit is not a foreign-tab race.
      const local = state.revision < ownCommittedRevision.current
        ? { ...state, revision: ownCommittedRevision.current } : state
      const decision = writeGameStateToStorage(window.localStorage, local)

      // A newer tab won the revision race. Adopt it instead of overwriting it
      // with a snapshot based on stale state.
      if (decision.kind === 'adopt') {
        queueMicrotask(() => {
          localBattleId.current = null
          setLocalSessionId(null)
          ownCommittedRevision.current = 0
          setState({ ...decision.snapshot, dirty: false })
          setExternalRevision((value) => value + 1)
        })
        return
      }

      const committed = decision.snapshot
      ownCommittedRevision.current = committed.revision
      queueMicrotask(() => {
        if (ownCommittedRevision.current !== committed.revision) return
        setState((current) =>
          current.progress === state.progress && current.rpgState === state.rpgState &&
            current.battleSession === state.battleSession
            ? { ...current, revision: Math.max(current.revision, committed.revision), dirty: false }
            : { ...current, revision: Math.max(current.revision, committed.revision) },
        )
      })
    } catch {
      lastWrite.current = null
      // Storage unavailable: the shared in-memory state remains usable.
    }
  }, [state])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const synchronize = (event: StorageEvent) => {
      if (event.key !== GAME_STATE_STORAGE_KEY && event.key !== null) return
      if (event.newValue === null) {
        localBattleId.current = null
        setLocalSessionId(null)
        ownCommittedRevision.current = 0
        setExternalRevision((value) => value + 1)
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
      if (incoming.revision <= state.revision) return
      localBattleId.current = null
      setLocalSessionId(null)
      ownCommittedRevision.current = 0
      setExternalRevision((value) => value + 1)
      setState((current) => {
        if (incoming.revision <= current.revision) return current
        return { ...incoming, dirty: false }
      })
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [state.revision])

  const visibleState = getVisibleBattleState(state, localSessionId)
  const stats = useMemo(() => getPlayerStats(visibleState.progress.exp), [visibleState.progress.exp])
  const progressValue = useMemo(
    () => ({ progress: visibleState.progress, stats, setProgress, resetProgress }),
    [resetProgress, setProgress, visibleState.progress, stats],
  )
  const rpgValue = useMemo(
    () => ({ rpgState: visibleState.rpgState, setRpgState }),
    [setRpgState, visibleState.rpgState],
  )
  const battleSessionValue = useMemo(
    () => ({ start, update, commit, abort, externalRevision }),
    [start, update, commit, abort, externalRevision],
  )

  return (
    <ProgressContext.Provider value={progressValue}>
      <RpgContext.Provider value={rpgValue}>
        <BattleSessionContext.Provider value={battleSessionValue}>{children}</BattleSessionContext.Provider>
      </RpgContext.Provider>
    </ProgressContext.Provider>
  )
}
