export const WORLD_WIDTH = 40
export const WORLD_HEIGHT = 28
export const VIEWPORT_WIDTH = 11
export const VIEWPORT_HEIGHT = 9
export const WORLD_START = { x: 20, y: 14 } as const

export type WorldRegion = 'javascript' | 'hub' | 'typescript'
export type Terrain =
  | 'mountain'
  | 'water'
  | 'road'
  | 'town'
  | 'grass'
  | 'tall-grass'
  | 'forest'
  | 'boss'
  | 'shop'
  | 'npc'
  | 'recovery'
  | 'treasure'

export type WorldCell = {
  x: number
  y: number
  terrain: Terrain
  region: WorldRegion
}

export const JS_BOSS_POSITION = { x: 8, y: 3 } as const
export const TS_BOSS_POSITION = { x: 32, y: 3 } as const
export const SHOP_POSITION = { x: 20, y: 12 } as const
export const BYTE_POSITION = { x: 19, y: 13 } as const
export const RECOVERY_POSITION = { x: 21, y: 16 } as const

export const WORLD_TREASURES = [
  { id: 'js-debug-cache', position: { x: 10, y: 19 }, region: 'javascript' },
  { id: 'ts-supply-cache', position: { x: 30, y: 19 }, region: 'typescript' },
] as const

export type WorldTreasureId = (typeof WORLD_TREASURES)[number]['id']

const samePosition = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x && a.y === b.y

export function getTreasureAtPosition(position: { x: number; y: number }) {
  return WORLD_TREASURES.find((treasure) => samePosition(position, treasure.position))
}

export function getWorldRegion(x: number): WorldRegion {
  if (x <= 17) return 'javascript'
  if (x >= 23) return 'typescript'
  return 'hub'
}

export function getTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1) return 'mountain'
  if (samePosition(position, JS_BOSS_POSITION) || samePosition(position, TS_BOSS_POSITION)) return 'boss'
  if (samePosition(position, SHOP_POSITION)) return 'shop'
  if (samePosition(position, BYTE_POSITION)) return 'npc'
  if (samePosition(position, RECOVERY_POSITION)) return 'recovery'
  if (getTreasureAtPosition(position)) return 'treasure'

  if (y === 14 || (x === 8 && y >= 3 && y <= 14) || (x === 32 && y >= 3 && y <= 14)) {
    return 'road'
  }

  if (x >= 18 && x <= 22 && y >= 10 && y <= 17) return 'town'

  if (x >= 4 && x <= 7 && y >= 20 && y <= 23) return 'water'
  if ((x === 14 && y >= 5 && y <= 9) || (x === 26 && y >= 18 && y <= 22)) return 'mountain'

  const region = getWorldRegion(x)
  if (region === 'javascript') {
    return (x * 3 + y * 5) % 7 <= 2 ? 'tall-grass' : 'grass'
  }
  if (region === 'typescript') {
    return (x * 5 + y * 3) % 6 <= 3 ? 'forest' : 'grass'
  }
  return 'town'
}

export function isWalkableTerrain(terrain: Terrain): boolean {
  return !['mountain', 'water', 'boss', 'shop', 'npc', 'recovery', 'treasure'].includes(terrain)
}

export function isEncounterTerrain(terrain: Terrain): boolean {
  return terrain === 'tall-grass' || terrain === 'forest'
}

export function getEncounterChance(terrain: Terrain): number {
  if (terrain === 'tall-grass') return 0.18
  if (terrain === 'forest') return 0.16
  return 0
}

export function getVisibleWorldCells(position: { x: number; y: number }): WorldCell[] {
  const halfWidth = Math.floor(VIEWPORT_WIDTH / 2)
  const halfHeight = Math.floor(VIEWPORT_HEIGHT / 2)
  const startX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, position.x - halfWidth))
  const startY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, position.y - halfHeight))
  const cells: WorldCell[] = []

  for (let y = startY; y < startY + VIEWPORT_HEIGHT; y += 1) {
    for (let x = startX; x < startX + VIEWPORT_WIDTH; x += 1) {
      cells.push({ x, y, terrain: getTerrain(x, y), region: getWorldRegion(x) })
    }
  }
  return cells
}

export function getEncounterBattleId(
  region: WorldRegion,
  unlockedStageIds: readonly number[],
  clearedStageIds: readonly number[],
  roll: number,
): number | null {
  if (region === 'javascript') {
    if (!clearedStageIds.includes(1)) return 1
    if (unlockedStageIds.includes(2) && !clearedStageIds.includes(2)) return 2
    return roll < 0.5 ? 1 : 2
  }
  if (region === 'typescript') {
    if (!clearedStageIds.includes(4)) return 4
    if (unlockedStageIds.includes(5) && !clearedStageIds.includes(5)) return 5
    return roll < 0.5 ? 4 : 5
  }
  return null
}

export function isAdjacent(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}
