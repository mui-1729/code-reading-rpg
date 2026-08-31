import { getAreaBattleSequence, type ProgressionArea } from '../progression/progressionGraph'
import { areaById, type AreaDefinition } from './areas'
import { battles } from './battles'
import type { Battle } from './types'

function isProgressionArea(areaId: string): areaId is ProgressionArea {
  return areaId === 'javascript' || areaId === 'typescript'
}

export function getBattlesForArea(areaId: string): Battle[] {
  const areaBattles = battles.filter((battle) => battle.areaId === areaId)
  if (!isProgressionArea(areaId)) return areaBattles

  const order = new Map(getAreaBattleSequence(areaId).map((battleId, index) => [battleId, index]))
  return [...areaBattles].sort(
    (left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  )
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
