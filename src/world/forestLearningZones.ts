export type ForestLearningBattleId = 10 | 11 | 12 | 14

export const FOREST_LEARNING_BATTLE_IDS = [10, 11, 12, 14] as const

export const FOREST_LEARNING_ZONES = [
  { id: 'east-entry', minX: 45, maxX: 47, minY: 18, maxY: 23 },
  { id: 'east-north', minX: 37, maxX: 44, minY: 4, maxY: 9 },
  { id: 'east-south', minX: 40, maxX: 48, minY: 33, maxY: 38 },
  { id: 'riverbank', minX: 34, maxX: 40, minY: 10, maxY: 16 },
  { id: 'center-north', minX: 18, maxX: 28, minY: 3, maxY: 10 },
  { id: 'center-south', minX: 22, maxX: 28, minY: 22, maxY: 29 },
  { id: 'west-north', minX: 3, maxX: 17, minY: 3, maxY: 12 },
  { id: 'west-mid', minX: 6, maxX: 18, minY: 14, maxY: 25 },
  { id: 'west-south', minX: 3, maxX: 16, minY: 28, maxY: 38 },
] as const

export type ForestLearningZoneId = (typeof FOREST_LEARNING_ZONES)[number]['id']
export type ForestLearningBattleZones = Partial<Record<ForestLearningBattleId, ForestLearningZoneId>>

export function isForestLearningZoneId(value: unknown): value is ForestLearningZoneId {
  return FOREST_LEARNING_ZONES.some((zone) => zone.id === value)
}

export function getForestLearningZoneAtPosition(position: { x: number; y: number }): ForestLearningZoneId | null {
  const zone = FOREST_LEARNING_ZONES.find(
    (candidate) =>
      position.x >= candidate.minX &&
      position.x <= candidate.maxX &&
      position.y >= candidate.minY &&
      position.y <= candidate.maxY,
  )
  return zone?.id ?? null
}

export function getUsedForestLearningZones(assignments: ForestLearningBattleZones | undefined): Set<ForestLearningZoneId> {
  return new Set(
    FOREST_LEARNING_BATTLE_IDS.flatMap((battleId) => {
      const zoneId = assignments?.[battleId]
      return zoneId ? [zoneId] : []
    }),
  )
}
