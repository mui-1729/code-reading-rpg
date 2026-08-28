export const WORLD_WIDTH = 40
export const WORLD_HEIGHT = 28
export const VIEWPORT_WIDTH = 11
export const VIEWPORT_HEIGHT = 9
export const WORLD_START = { x: 20, y: 14 } as const

export const OVERWORLD_MAP_ID = 'overworld' as const
export const JS_VILLAGE_MAP_ID = 'js-village' as const
export type WorldMapId = typeof OVERWORLD_MAP_ID | typeof JS_VILLAGE_MAP_ID

const WORLD_MAP_DIMENSIONS: Record<WorldMapId, { width: number; height: number }> = {
  [OVERWORLD_MAP_ID]: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  [JS_VILLAGE_MAP_ID]: { width: 21, height: 15 },
}

export const WORLD_MAP_STARTS: Record<WorldMapId, { x: number; y: number }> = {
  [OVERWORLD_MAP_ID]: { ...WORLD_START },
  [JS_VILLAGE_MAP_ID]: { x: 10, y: 12 },
}

export type WorldRegion = 'javascript' | 'hub' | 'typescript'
export type Terrain =
  | 'mountain'
  | 'water'
  | 'road'
  | 'town'
  | 'grass'
  | 'tall-grass'
  | 'woods'
  | 'deep-woods'
  | 'forest'
  | 'boss'
  | 'shop'
  | 'npc'
  | 'recovery'
  | 'treasure'
  | 'village'
  | 'exit'
  | 'house'

export type WorldCell = {
  mapId: WorldMapId
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
export const JS_VILLAGE_POSITION = { x: 14, y: 12 } as const
export const JS_VILLAGE_EXIT_POSITION = { x: 10, y: 14 } as const

export const WORLD_TREASURES = [
  {
    id: 'js-debug-cache',
    mapId: OVERWORLD_MAP_ID,
    position: { x: 10, y: 19 },
    region: 'javascript',
  },
  {
    id: 'ts-supply-cache',
    mapId: OVERWORLD_MAP_ID,
    position: { x: 30, y: 19 },
    region: 'typescript',
  },
] as const

export type WorldTreasureId = (typeof WORLD_TREASURES)[number]['id']

type WorldPortal = {
  fromMapId: WorldMapId
  position: { x: number; y: number }
  toMapId: WorldMapId
  targetPosition: { x: number; y: number }
  label: string
}

export const WORLD_PORTALS: readonly WorldPortal[] = [
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: JS_VILLAGE_POSITION,
    toMapId: JS_VILLAGE_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID],
    label: 'GREENFIELD VILLAGE',
  },
  {
    fromMapId: JS_VILLAGE_MAP_ID,
    position: JS_VILLAGE_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 14, y: 13 },
    label: 'JAVASCRIPT GRASSLAND',
  },
]

const samePosition = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x && a.y === b.y

export function isWorldMapId(value: unknown): value is WorldMapId {
  return value === OVERWORLD_MAP_ID || value === JS_VILLAGE_MAP_ID
}

export function getWorldMapDimensions(mapId: WorldMapId) {
  return WORLD_MAP_DIMENSIONS[mapId]
}

export function getWorldMapLabel(mapId: WorldMapId) {
  if (mapId === JS_VILLAGE_MAP_ID) return 'GREENFIELD VILLAGE'
  return 'CODE WORLD OVERWORLD'
}

export function isWorldPositionInBounds(
  mapId: WorldMapId,
  position: { x: number; y: number },
): boolean {
  const { width, height } = getWorldMapDimensions(mapId)
  return position.x >= 0 && position.x < width && position.y >= 0 && position.y < height
}

export function getWorldPortalAtPosition(
  mapId: WorldMapId,
  position: { x: number; y: number },
): WorldPortal | undefined {
  return WORLD_PORTALS.find(
    (portal) => portal.fromMapId === mapId && samePosition(position, portal.position),
  )
}

export function getTreasureAtPosition(
  position: { x: number; y: number },
  mapId: WorldMapId = OVERWORLD_MAP_ID,
) {
  return WORLD_TREASURES.find(
    (treasure) => treasure.mapId === mapId && samePosition(position, treasure.position),
  )
}

export function getWorldRegion(
  x: number,
  mapId: WorldMapId = OVERWORLD_MAP_ID,
): WorldRegion {
  if (mapId === JS_VILLAGE_MAP_ID) return 'javascript'
  if (x <= 17) return 'javascript'
  if (x >= 23) return 'typescript'
  return 'hub'
}

function getVillageTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (samePosition(position, JS_VILLAGE_EXIT_POSITION)) return 'exit'
  if (x <= 0 || y <= 0 || x >= 20 || y >= 14) return 'house'

  if (
    (x >= 2 && x <= 5 && y >= 2 && y <= 5) ||
    (x >= 15 && x <= 18 && y >= 2 && y <= 5) ||
    (x >= 3 && x <= 6 && y >= 9 && y <= 11) ||
    (x >= 14 && x <= 17 && y >= 9 && y <= 11)
  ) {
    return 'house'
  }

  if ((x >= 9 && x <= 11) || y === 7) return 'road'
  if ((x + y) % 7 === 0) return 'grass'
  return 'town'
}

export function getTerrain(
  x: number,
  y: number,
  mapId: WorldMapId = OVERWORLD_MAP_ID,
): Terrain {
  const position = { x, y }
  const portal = getWorldPortalAtPosition(mapId, position)
  if (portal) return mapId === OVERWORLD_MAP_ID ? 'village' : 'exit'

  if (mapId === JS_VILLAGE_MAP_ID) return getVillageTerrain(x, y)

  if (x <= 0 || y <= 0 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1) return 'mountain'
  if (samePosition(position, JS_BOSS_POSITION) || samePosition(position, TS_BOSS_POSITION)) return 'boss'
  if (samePosition(position, SHOP_POSITION)) return 'shop'
  if (samePosition(position, BYTE_POSITION)) return 'npc'
  if (samePosition(position, RECOVERY_POSITION)) return 'recovery'
  if (getTreasureAtPosition(position, mapId)) return 'treasure'

  if (y === 14 || (x === 8 && y >= 3 && y <= 14) || (x === 32 && y >= 3 && y <= 14)) {
    return 'road'
  }

  if (x >= 18 && x <= 22 && y >= 10 && y <= 17) return 'town'

  if (x >= 4 && x <= 7 && y >= 20 && y <= 23) return 'water'
  if ((x === 14 && y >= 5 && y <= 9) || (x === 26 && y >= 18 && y <= 22)) return 'mountain'

  const region = getWorldRegion(x, mapId)
  if (region === 'javascript') {
    if (x <= 4) return (x + y) % 4 === 0 ? 'deep-woods' : 'woods'
    if (x <= 7) return (x + y) % 3 === 0 ? 'deep-woods' : 'woods'
    return (x * 3 + y * 5) % 7 <= 2 ? 'tall-grass' : 'grass'
  }
  if (region === 'typescript') {
    return (x * 5 + y * 3) % 6 <= 3 ? 'forest' : 'grass'
  }
  return 'town'
}

export function isWalkableTerrain(terrain: Terrain): boolean {
  return ![
    'mountain',
    'water',
    'boss',
    'shop',
    'npc',
    'recovery',
    'treasure',
    'house',
  ].includes(terrain)
}

export function isEncounterTerrain(terrain: Terrain): boolean {
  return ['tall-grass', 'woods', 'deep-woods', 'forest'].includes(terrain)
}

export function getEncounterChance(terrain: Terrain): number {
  if (terrain === 'tall-grass') return 0.18
  if (terrain === 'woods') return 0.17
  if (terrain === 'deep-woods') return 0.2
  if (terrain === 'forest') return 0.16
  return 0
}

export function getVisibleWorldCells(
  position: { x: number; y: number },
  mapId: WorldMapId = OVERWORLD_MAP_ID,
): WorldCell[] {
  const { width, height } = getWorldMapDimensions(mapId)
  const halfWidth = Math.floor(VIEWPORT_WIDTH / 2)
  const halfHeight = Math.floor(VIEWPORT_HEIGHT / 2)
  const startX = Math.max(0, Math.min(width - VIEWPORT_WIDTH, position.x - halfWidth))
  const startY = Math.max(0, Math.min(height - VIEWPORT_HEIGHT, position.y - halfHeight))
  const cells: WorldCell[] = []

  for (let y = startY; y < startY + VIEWPORT_HEIGHT; y += 1) {
    for (let x = startX; x < startX + VIEWPORT_WIDTH; x += 1) {
      cells.push({
        mapId,
        x,
        y,
        terrain: getTerrain(x, y, mapId),
        region: getWorldRegion(x, mapId),
      })
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
