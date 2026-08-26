import { areaById, type AreaDefinition } from './areas'
import { battles } from './battles'
import type { Battle } from './types'

export function getBattlesForArea(areaId: string): Battle[] {
  return battles.filter((battle) => battle.areaId === areaId)
}

export function getAreaForBattle(battleId: number): AreaDefinition | undefined {
  const battle = battles.find((candidate) => candidate.id === battleId)
  return battle ? areaById[battle.areaId] : undefined
}

export function getBossBattleForArea(areaId: string): Battle | undefined {
  const area = areaById[areaId]
  if (!area?.bossBattleId) return undefined

  const boss = battles.find((battle) => battle.id === area.bossBattleId)
  return boss?.areaId === area.id ? boss : undefined
}
