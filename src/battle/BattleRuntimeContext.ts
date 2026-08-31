import { createContext, useContext } from 'react'
import type { AreaCapabilities } from '../game/areas'
import type { Enemy } from '../game/types'
import type { BattleVictoryReward } from '../progression/types'

export type BattleRuntimePhase = 'battle' | 'victory' | 'defeat'
export type BattleRuntimeSnapshot = {
  areaId: string
  battleId: number
  capabilities: AreaCapabilities
  enemies: readonly Enemy[]
  isModalOpen: boolean
  isResolving: boolean
  phase: BattleRuntimePhase
  playerHp: number
  playerMaxHp: number
  selectedSkillId: string | null
  turn: number
  result: BattleVictoryReward | null
}

export type BattleRuntimeContextValue = {
  snapshot: BattleRuntimeSnapshot | null
  setSnapshot: (snapshot: BattleRuntimeSnapshot | null) => void
}

export const BattleRuntimeContext = createContext<BattleRuntimeContextValue | null>(null)

export function useBattleRuntime() {
  const context = useContext(BattleRuntimeContext)
  if (!context) throw new Error('useBattleRuntime must be used within BattleRuntimeProvider')
  return context
}
