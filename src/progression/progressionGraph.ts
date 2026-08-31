export type ProgressionArea = 'javascript' | 'typescript'

export type ProgressionNode = {
  key: string
  battleId: number
  area: ProgressionArea
  prerequisites: readonly string[]
}

// `battleId` is a legacy persisted/runtime identifier. It is deliberately not
// the player-facing chapter number and must never define story order. Stable
// semantic keys define the route, while display numbers are derived from each
// area's current sequence. That lets us insert/reorder story beats without
// renumbering saves, URLs, or every later Area.
const javascriptNodes = [
  { key: 'js-incident-first', battleId: 1, area: 'javascript', prerequisites: [] },
  {
    key: 'js-training-hp',
    battleId: 7,
    area: 'javascript',
    prerequisites: ['js-incident-first'],
  },
  { key: 'js-training-name', battleId: 8, area: 'javascript', prerequisites: ['js-training-hp'] },
  { key: 'js-training-find', battleId: 9, area: 'javascript', prerequisites: ['js-training-name'] },
  { key: 'js-forest-and', battleId: 10, area: 'javascript', prerequisites: ['js-training-find'] },
  { key: 'js-forest-or', battleId: 11, area: 'javascript', prerequisites: ['js-forest-and'] },
  { key: 'js-forest-combined', battleId: 12, area: 'javascript', prerequisites: ['js-forest-or'] },
  { key: 'js-forest-guardian', battleId: 13, area: 'javascript', prerequisites: ['js-forest-combined'] },
  { key: 'js-forest-filter', battleId: 14, area: 'javascript', prerequisites: ['js-forest-guardian'] },
  { key: 'js-incident-second', battleId: 2, area: 'javascript', prerequisites: ['js-forest-filter'] },
  { key: 'js-deep-filter', battleId: 15, area: 'javascript', prerequisites: ['js-incident-second'] },
  { key: 'js-deep-map', battleId: 16, area: 'javascript', prerequisites: ['js-deep-filter'] },
  { key: 'js-deep-some', battleId: 17, area: 'javascript', prerequisites: ['js-deep-map'] },
  { key: 'js-deep-every', battleId: 18, area: 'javascript', prerequisites: ['js-deep-some'] },
  { key: 'js-deep-guardian', battleId: 19, area: 'javascript', prerequisites: ['js-deep-every'] },
  { key: 'js-deep-sort', battleId: 20, area: 'javascript', prerequisites: ['js-deep-guardian'] },
  { key: 'js-deep-safe-read', battleId: 21, area: 'javascript', prerequisites: ['js-deep-sort'] },
  { key: 'js-deep-reduce', battleId: 22, area: 'javascript', prerequisites: ['js-deep-safe-read'] },
  {
    key: 'js-final-code-core',
    battleId: 3,
    area: 'javascript',
    prerequisites: ['js-deep-reduce'],
  },
] as const satisfies readonly ProgressionNode[]

const typescriptNodes = [
  { key: 'ts-api-contract', battleId: 4, area: 'typescript', prerequisites: ['js-final-code-core'] },
  { key: 'ts-optional-union', battleId: 5, area: 'typescript', prerequisites: ['ts-api-contract'] },
  {
    key: 'ts-final-shared-contract',
    battleId: 6,
    area: 'typescript',
    prerequisites: ['ts-optional-union'],
  },
] as const satisfies readonly ProgressionNode[]

const nodes: readonly ProgressionNode[] = [...javascriptNodes, ...typescriptNodes]

export const progressionNodes = nodes
export const JAVASCRIPT_BATTLE_SEQUENCE = javascriptNodes.map((node) => node.battleId)
export const TYPESCRIPT_BATTLE_SEQUENCE = typescriptNodes.map((node) => node.battleId)

const nodeByBattleId = new Map(nodes.map((node) => [node.battleId, node]))
const nodeByKey = new Map(nodes.map((node) => [node.key, node]))
const nodesByArea: Record<ProgressionArea, readonly ProgressionNode[]> = {
  javascript: javascriptNodes,
  typescript: typescriptNodes,
}

export function getProgressionNode(battleId: number): ProgressionNode | undefined {
  return nodeByBattleId.get(battleId)
}

export function getProgressionNodeByKey(key: string): ProgressionNode | undefined {
  return nodeByKey.get(key)
}

export function getAreaBattleSequence(area: ProgressionArea): readonly number[] {
  return nodesByArea[area].map((node) => node.battleId)
}

export function getAreaProgressionKeys(area: ProgressionArea): readonly string[] {
  return nodesByArea[area].map((node) => node.key)
}

export function getBattleStoryNumber(battleId: number): number | undefined {
  const node = getProgressionNode(battleId)
  if (!node) return undefined
  const index = nodesByArea[node.area].findIndex((candidate) => candidate.key === node.key)
  return index >= 0 ? index + 1 : undefined
}

export function getBattleDisplayCode(battleId: number): string | undefined {
  const node = getProgressionNode(battleId)
  const storyNumber = getBattleStoryNumber(battleId)
  if (!node || storyNumber === undefined) return undefined
  const prefix = node.area === 'javascript' ? 'JS' : 'TS'
  return `${prefix}-${String(storyNumber).padStart(2, '0')}`
}

function isProgressionKeySatisfied(
  key: string,
  clearedStageIds: readonly number[],
  visiting: ReadonlySet<string> = new Set(),
): boolean {
  const requiredNode = nodeByKey.get(key)
  if (!requiredNode || !clearedStageIds.includes(requiredNode.battleId)) return false
  if (visiting.has(key)) return false

  const nextVisiting = new Set(visiting)
  nextVisiting.add(key)
  return requiredNode.prerequisites.every((requiredKey) =>
    isProgressionKeySatisfied(requiredKey, clearedStageIds, nextVisiting),
  )
}

export function areBattlePrerequisitesMet(
  battleId: number,
  clearedStageIds: readonly number[],
): boolean {
  const node = getProgressionNode(battleId)
  if (!node) return false
  return node.prerequisites.every((requiredKey) =>
    isProgressionKeySatisfied(requiredKey, clearedStageIds),
  )
}

export function isBattleAccessible(
  battleId: number,
  clearedStageIds: readonly number[],
): boolean {
  if (!getProgressionNode(battleId)) return false
  // An already-cleared Battle remains replayable for compatibility, but its
  // clear bit does not authorize later nodes unless its own ancestry is valid.
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
  const sequence = nodesByArea[area]
  const index = sequence.findIndex((node) => node.battleId === battleId)
  return index >= 0 ? sequence[index + 1]?.battleId : undefined
}

export function getNextAccessibleBattleId(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): number | undefined {
  return nodesByArea[area].find(
    (node) =>
      !clearedStageIds.includes(node.battleId) &&
      areBattlePrerequisitesMet(node.battleId, clearedStageIds),
  )?.battleId
}

export function getAreaClearedBattleCount(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): number {
  return nodesByArea[area].filter((node) => clearedStageIds.includes(node.battleId)).length
}

export function isAreaProgressionComplete(
  area: ProgressionArea,
  clearedStageIds: readonly number[],
): boolean {
  return nodesByArea[area].every((node) => clearedStageIds.includes(node.battleId))
}
