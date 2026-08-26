import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { PlayerProgress, PlayerStats } from './types'

export type ProgressContextValue = {
  progress: PlayerProgress
  stats: PlayerStats
  setProgress: Dispatch<SetStateAction<PlayerProgress>>
  resetProgress: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
