import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
  const [state, setState] = useState(loadInitialTutorialState)

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
    setState((current) => advanceFieldInteraction(current))
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

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(TUTORIAL_STORAGE_KEY)
      } catch {
        // Reset in-memory state even when storage is unavailable.
      }
    }
    setState(createInitialTutorialState())
  }, [])

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
