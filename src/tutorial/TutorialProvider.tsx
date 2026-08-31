import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBattleSessionContext } from '../battle/BattleSessionContext'
import { useRpg } from '../rpg'
import { OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'
import { TutorialContext } from './TutorialContext'
import { restoreTutorialState, serializeTutorialState, TUTORIAL_STORAGE_KEY } from './storage'
import {
  completeBattleTutorial,
  completeFieldInteraction as advanceFieldInteraction,
  completeFieldMove as advanceFieldMove,
  createInitialTutorialState,
  enterBattleTutorial,
  skipTutorial,
} from './tutorial'

type TutorialProviderProps = {
  children: ReactNode
}

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

function loadInitialTutorialState() {
  if (typeof window === 'undefined') return createInitialTutorialState()

  try {
    return restoreTutorialState(window.localStorage.getItem(TUTORIAL_STORAGE_KEY))
  } catch {
    return createInitialTutorialState()
  }
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const { setRpgState } = useRpg()
  const { abort: abortBattle } = useBattleSessionContext()
  const [state, setState] = useState(loadInitialTutorialState)
  const worldInteractionConfirmed = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, serializeTutorialState(state))
    } catch {
      // Storage unavailable: keep tutorial state usable for this session.
    }
  }, [state])

  const completeFieldMove = useCallback(() => {
    setState((current) => advanceFieldMove(current))
  }, [])

  const completeFieldInteraction = useCallback(() => {
    setState((current) => {
      if (
        current.status === 'active' &&
        current.phase === 'field-interact' &&
        typeof window !== 'undefined' &&
        window.location.pathname === '/world' &&
        !worldInteractionConfirmed.current
      ) {
        return current
      }
      worldInteractionConfirmed.current = false
      return advanceFieldInteraction(current)
    })
  }, [])

  const enterBattle = useCallback(() => {
    setState((current) => enterBattleTutorial(current))
  }, [])

  const completeBattle = useCallback(() => {
    setState((current) => completeBattleTutorial(current))
  }, [])

  const skip = useCallback(() => {
    setState((current) => skipTutorial(current))
  }, [])

  useEffect(() => {
    const confirmWorldInteraction = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return
      if (!target.closest('.world-interact.tutorial-highlight')) return
      worldInteractionConfirmed.current = true
      setState((current) => advanceFieldInteraction(current))
    }

    const onClick = (event: MouseEvent) => confirmWorldInteraction(event.target)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const highlighted = document.querySelector('.world-interact.tutorial-highlight')
      if (!highlighted) return
      worldInteractionConfirmed.current = true
      setState((current) => advanceFieldInteraction(current))
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(TUTORIAL_STORAGE_KEY)
      } catch {
        // Reset in-memory state even when storage is unavailable.
      }
    }

    worldInteractionConfirmed.current = false
    // Replay leaves Battle: roll back its tentative HP/items before applying the
    // new World position. Later App cleanup must not undo this transition.
    abortBattle()
    setRpgState((current) => ({
      ...current,
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { ...WORLD_START },
      stepsSinceEncounter: 0,
    }))
    setState(createInitialTutorialState())

    if (typeof window !== 'undefined' && window.location.pathname !== '/world') {
      window.history.replaceState(null, '', '/world')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [abortBattle, setRpgState])

  useEffect(() => {
    window.addEventListener(PROGRESS_RESET_EVENT, reset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, reset)
  }, [reset])

  const value = useMemo(
    () => ({
      state,
      completeFieldMove,
      completeFieldInteraction,
      enterBattle,
      completeBattle,
      skip,
      reset,
    }),
    [
      completeBattle,
      completeFieldInteraction,
      completeFieldMove,
      enterBattle,
      reset,
      skip,
      state,
    ],
  )

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
}
