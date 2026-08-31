import { createContext, useContext } from 'react'
import type { BattleCommitEvent, BattleSessionIdentity, BattleStateAction } from './sessionTransaction'

export type BattleSessionContextValue = {
  start: (identity: BattleSessionIdentity) => void
  update: (id: string, action: BattleStateAction) => void
  commit: (id: string, event: BattleCommitEvent, action?: BattleStateAction) => void
  // Omit the ID only for an explicit global transition such as Tutorial replay.
  abort: (id?: string) => void
  externalRevision: number
}

export const BattleSessionContext = createContext<BattleSessionContextValue | null>(null)

export function useBattleSessionContext() {
  const context = useContext(BattleSessionContext)
  if (!context) throw new Error('Battle session requires GameStateProvider')
  return context
}
