import { createContext } from 'react'
import type { TutorialState } from './tutorial'

export type TutorialContextValue = {
  state: TutorialState
  completeFieldMove: () => void
  completeFieldInteraction: () => void
  enterBattle: () => void
  completeBattle: () => void
  skip: () => void
  reset: () => void
}

export const TutorialContext = createContext<TutorialContextValue | null>(null)
