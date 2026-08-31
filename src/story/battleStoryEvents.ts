import { getAreaDefinition, parseBattleRoute } from '../game/areas'
import type { BattleStoryEvent } from './types'

export type BattleStoryPhase = 'pre' | 'post'

export function getBattleStoryEventForBattle(
  areaId: string,
  battleId: number,
  phase: BattleStoryPhase,
  clearedStageIds: readonly number[] = [],
): BattleStoryEvent | undefined {
  const area = getAreaDefinition(areaId)
  if (!area?.capabilities.story || !area.battleIds.includes(battleId)) return undefined
  if (phase === 'pre' && clearedStageIds.includes(battleId)) return undefined
  return area.storyEvent?.(battleId, phase)
}

/** Compatibility adapter for route-based callers and historical story fixtures. */
export function getBattleStoryEvent(
  pathname: string,
  phase: BattleStoryPhase,
  clearedStageIds: readonly number[] = [],
): BattleStoryEvent | undefined {
  const route = parseBattleRoute(pathname)
  return route
    ? getBattleStoryEventForBattle(route.area.id, route.battleId, phase, clearedStageIds)
    : undefined
}
