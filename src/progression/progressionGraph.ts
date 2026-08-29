export type ProgressionArea = 'javascript' | 'typescript'

export type ProgressionNode = {
  battleId: number
  area: ProgressionArea
  prerequisites: readonly number[]
}

export const JAVASCRIPT_BATTLE_SEQUENCE = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 1, 2, 3,
] as const

export const TYPESCRIPT_BATTLE_SEQUENCE = [4, 5, 6] as const

const nodes: readonly ProgressionNode[] = [
  { battleId: 7, area: 'javascript', prerequisites: [] },
  { battleId: 8, area: 'javascript', prerequisites: [7] },
  { battleId: 9, area: 'javascript', prerequisites: [8] },
  { battleId: 10, area: 'javascript', prerequisites: [9] },
  { battleId: 11, area: 'javascript', prerequisites: [10] },
  { battleId: 12, area: 'javascript', prerequisites: [11] },
  { battleId: 13, area: 'javascript', prerequisites: [12] },
  { battleId: 14, area: 'javascript', prerequisites: [13] },
  { battleId: 15, area: 'javascript', prerequisites: [14] },
  { battleId: 16, area: 'javascript', prerequisites: [15] },
  { battleId: 17, area: 'javascript', prerequisites: [16] },
  { battleId: 18, area: 'javascript', prerequisites: [17] },
  { battleId: 19, area: 'javascript', prerequisites: [18] },
  { battleId: 20, area: 'javascript', prerequisites: [19] },
  { battleId: 21, area: 'javascript', prerequisites: [20] },
  { battleId: 22, area: 'javascript', prerequisites: [21] },
  { battleId: 1, area: 'javascript', prerequisites: [22] },
  { battleId: 2, area: 'javascript', prerequisites: [22, 1] },
  { battleId: 3, area: 'javascript', prerequisites: [22, 1, 2] },
  { battleId: 4, area: 'typescript', prerequisites: [3] },
  { battleId: 5, area: 'typescript', prerequisites: [3, 4] },
  { battleId: 6, area: 'typescript', prerequisites: [3, 4, 5] },
]

export const progressionNodes = nodes

const nodeByBattleId = new Map(nodes.map((node) => [node.battleId, node]))

const sequenceByArea: Record<ProgressionArea, readonly number[]> = {
  javascript: JAVASCRIPT_BATTLE_SEQUENCE,
  typescript: TYPESCRIPT_BATTLE_SEQUENCE,
}

export function getProgressionNode(battleId: number): ProgressionNode | undefined {
  return nodeByBattleId.get(battleId)
}

export function getAreaBattleSequence(area: ProgressionArea): readonly number[] {
  return sequenceByArea[area]
}

export function areBattlePrerequisitesMet(
  battleId: number,
  clearedStageIds: readonly number[],
): boolean {
  const node = getProgressionNode(battleId)
  if (!node) return false
  return node.prerequisites.every((requiredId) => clearedStageIds.includes(requiredId))
}

export function isBattleAccessible(
  battleId: number,
  clearedStageIds: readonly number[],
): boolean {
  if (!getProgressionNode(battleId)) return false
  if (clearedStageIds.includes(battleId)) return true
  return areBattlePrerequisitesMet(battleId, clearedStageIds)
}

export function getCanonicalUnlockedStageIds(
  clearedStageIds: readonly number[],
): number[] {
  return nodes
    .filter(
      (node) =>
        clearedStageIds.includes(node.battleId) ||
        areBattlePrerequisitesMet(node.battleId, clearedStageIds),
    )
    .map((node) => node.battleId)
}

export function getNextBattleId(
  area: ProgressionArea,
  battleId: number,
): number | undefined {
  const sequence = sequenceByArea[area]
  const index = sequence.indexOf(battleId)
  return index >= 0 ? sequence[index + 1] : undefined
}

export function getNextAccessibleBattleId(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): number | undefined {
  return sequenceByArea[area].find(
    (battleId) =>
      !clearedStageIds.includes(battleId) &&
      areBattlePrerequisitesMet(battleId, clearedStageIds),
  )
}

export function getAreaClearedBattleCount(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): number {
  return sequenceByArea[area].filter((battleId) => clearedStageIds.includes(battleId)).length
}

export function isAreaProgressionComplete(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): boolean {
  return sequenceByArea[area].every((battleId) => clearedStageIds.includes(battleId))
}
