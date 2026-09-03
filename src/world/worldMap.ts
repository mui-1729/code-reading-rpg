export const WORLD_WIDTH = 40
export const WORLD_HEIGHT = 28
export const VIEWPORT_WIDTH = 11
export const VIEWPORT_HEIGHT = 9
export const WORLD_START = { x: 20, y: 14 } as const

export const OVERWORLD_MAP_ID = 'overworld' as const
export const JS_VILLAGE_MAP_ID = 'js-village' as const
export const JS_FOREST_MAP_ID = 'js-forest' as const
export const JS_DEEP_FOREST_MAP_ID = 'js-deep-forest' as const
export const TS_FRONTIER_MAP_ID = 'ts-frontier' as const
export type WorldMapId =
  | typeof OVERWORLD_MAP_ID
  | typeof JS_VILLAGE_MAP_ID
  | typeof JS_FOREST_MAP_ID
  | typeof JS_DEEP_FOREST_MAP_ID
  | typeof TS_FRONTIER_MAP_ID

const WORLD_MAP_DIMENSIONS: Record<WorldMapId, { width: number; height: number }> = {
  [OVERWORLD_MAP_ID]: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  [JS_VILLAGE_MAP_ID]: { width: 21, height: 15 },
  [JS_FOREST_MAP_ID]: { width: 31, height: 27 },
  [JS_DEEP_FOREST_MAP_ID]: { width: 31, height: 27 },
  [TS_FRONTIER_MAP_ID]: { width: 31, height: 21 },
}

export const WORLD_MAP_STARTS: Record<WorldMapId, { x: number; y: number }> = {
  [OVERWORLD_MAP_ID]: { ...WORLD_START },
  [JS_VILLAGE_MAP_ID]: { x: 10, y: 12 },
  [JS_FOREST_MAP_ID]: { x: 28, y: 10 },
  [JS_DEEP_FOREST_MAP_ID]: { x: 28, y: 10 },
  [TS_FRONTIER_MAP_ID]: { x: 2, y: 10 },
}

export type WorldRegion = 'javascript' | 'hub' | 'typescript'
export type Terrain =
  | 'mountain'
  | 'water'
  | 'road'
  | 'stone'
  | 'crystal'
  | 'ruins'
  | 'gate'
  | 'town'
  | 'grass'
  | 'tall-grass'
  | 'woods'
  | 'deep-woods'
  | 'forest'
  | 'boss'
  | 'midboss'
  | 'shop'
  | 'npc'
  | 'recovery'
  | 'treasure'
  | 'village'
  | 'exit'
  | 'house'
  | 'training'

export type WorldCell = {
  mapId: WorldMapId
  x: number
  y: number
  terrain: Terrain
  region: WorldRegion
}

export const JS_BOSS_POSITION = { x: 8, y: 3 } as const
export const TS_BOSS_POSITION = { x: 27, y: 4 } as const
export const SHOP_POSITION = { x: 20, y: 12 } as const
export const BYTE_POSITION = { x: 19, y: 13 } as const
export const RECOVERY_POSITION = { x: 21, y: 16 } as const
export const JS_VILLAGE_POSITION = { x: 14, y: 12 } as const
export const JS_VILLAGE_EXIT_POSITION = { x: 10, y: 14 } as const
export const JS_VILLAGE_TRAINING_POSITION = { x: 12, y: 7 } as const
export const JS_FOREST_POSITION = { x: 7, y: 14 } as const
export const JS_FOREST_EXIT_POSITION = { x: 30, y: 10 } as const
export const JS_FOREST_MIDBOSS_POSITION = { x: 5, y: 10 } as const
export const JS_FOREST_DEEP_FOREST_POSITION = { x: 1, y: 10 } as const
export const JS_DEEP_FOREST_EXIT_POSITION = { x: 30, y: 10 } as const
export const JS_DEEP_FOREST_CORE_EXIT_POSITION = { x: 1, y: 10 } as const
export const TS_FRONTIER_GATE_POSITION = { x: 23, y: 14 } as const
export const TS_FRONTIER_EXIT_POSITION = { x: 1, y: 10 } as const

export const WORLD_TREASURES = [
  {
    id: 'js-debug-cache',
    mapId: OVERWORLD_MAP_ID,
    position: { x: 10, y: 19 },
    region: 'javascript',
  },
  {
    id: 'js-forest-supply',
    mapId: JS_FOREST_MAP_ID,
    position: { x: 20, y: 20 },
    region: 'javascript',
  },
  {
    id: 'js-deep-forest-cache',
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 14, y: 22 },
    region: 'javascript',
  },
  {
    id: 'ts-supply-cache',
    mapId: TS_FRONTIER_MAP_ID,
    position: { x: 20, y: 15 },
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
  requiredClearedStageId?: number
}

export const WORLD_PORTALS: readonly WorldPortal[] = [
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: JS_VILLAGE_POSITION,
    toMapId: JS_VILLAGE_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID],
    label: 'GREENFIELD VILLAGE',
    requiredClearedStageId: 1,
  },
  {
    fromMapId: JS_VILLAGE_MAP_ID,
    position: JS_VILLAGE_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 14, y: 13 },
    label: 'JAVASCRIPT GRASSLAND',
  },
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: JS_FOREST_POSITION,
    toMapId: JS_FOREST_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_FOREST_MAP_ID],
    label: 'JAVASCRIPT FOREST',
    requiredClearedStageId: 9,
  },
  {
    fromMapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 8, y: 14 },
    label: 'JAVASCRIPT GRASSLAND',
  },
  {
    fromMapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_DEEP_FOREST_POSITION,
    toMapId: JS_DEEP_FOREST_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID],
    label: 'JAVASCRIPT DEEP FOREST',
    requiredClearedStageId: 14,
  },
  {
    fromMapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_EXIT_POSITION,
    toMapId: JS_FOREST_MAP_ID,
    targetPosition: { x: 2, y: 10 },
    label: 'JAVASCRIPT FOREST',
  },
  {
    fromMapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_CORE_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 8, y: 6 },
    label: 'CODE CORE APPROACH',
    requiredClearedStageId: 22,
  },
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: TS_FRONTIER_GATE_POSITION,
    toMapId: TS_FRONTIER_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[TS_FRONTIER_MAP_ID],
    label: 'TYPESCRIPT FRONTIER',
    requiredClearedStageId: 3,
  },
  {
    fromMapId: TS_FRONTIER_MAP_ID,
    position: TS_FRONTIER_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 22, y: 14 },
    label: 'CENTRAL HUB',
  },
]

const samePosition = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x && a.y === b.y

export function isWorldMapId(value: unknown): value is WorldMapId {
  return (
    value === OVERWORLD_MAP_ID ||
    value === JS_VILLAGE_MAP_ID ||
    value === JS_FOREST_MAP_ID ||
    value === JS_DEEP_FOREST_MAP_ID ||
    value === TS_FRONTIER_MAP_ID
  )
}

export function getWorldMapDimensions(mapId: WorldMapId) {
  return WORLD_MAP_DIMENSIONS[mapId]
}

export function getWorldMapLabel(mapId: WorldMapId) {
  if (mapId === JS_VILLAGE_MAP_ID) return 'GREENFIELD VILLAGE'
  if (mapId === JS_FOREST_MAP_ID) return 'JAVASCRIPT FOREST'
  if (mapId === JS_DEEP_FOREST_MAP_ID) return 'JAVASCRIPT DEEP FOREST'
  if (mapId === TS_FRONTIER_MAP_ID) return 'TYPESCRIPT FRONTIER'
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
  if (mapId === TS_FRONTIER_MAP_ID) return 'typescript'
  if (
    mapId === JS_VILLAGE_MAP_ID ||
    mapId === JS_FOREST_MAP_ID ||
    mapId === JS_DEEP_FOREST_MAP_ID
  ) {
    return 'javascript'
  }
  if (x <= 17) return 'javascript'
  if (x >= 23) return 'typescript'
  return 'hub'
}

function getVillageTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (samePosition(position, JS_VILLAGE_EXIT_POSITION)) return 'exit'
  if (samePosition(position, JS_VILLAGE_TRAINING_POSITION)) return 'training'
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

function getForestTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= 30 || y >= 26) return 'mountain'
  if (samePosition(position, JS_FOREST_MIDBOSS_POSITION)) return 'midboss'
  if (getTreasureAtPosition(position, JS_FOREST_MAP_ID)) return 'treasure'

  if (
    y === 10 ||
    (x === 22 && y >= 4 && y <= 10) ||
    (y === 4 && x >= 14 && x <= 22) ||
    (x === 24 && y >= 10 && y <= 20) ||
    (y === 20 && x >= 20 && x <= 24)
  ) {
    return 'road'
  }

  if (x === 18 && y <= 18) return 'water'

  if (
    (x >= 21 && x <= 25 && y >= 7 && y <= 13) ||
    (x >= 12 && x <= 16 && y >= 2 && y <= 6) ||
    (x >= 3 && x <= 8 && y >= 7 && y <= 13) ||
    (x >= 18 && x <= 26 && y >= 17 && y <= 23)
  ) {
    return (x + y) % 3 === 0 ? 'grass' : 'woods'
  }

  return (x * 5 + y * 3) % 5 <= 1 ? 'deep-woods' : 'woods'
}

function getDeepForestTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= 30 || y >= 26) return 'mountain'
  if (getTreasureAtPosition(position, JS_DEEP_FOREST_MAP_ID)) return 'treasure'

  if (
    y === 10 ||
    (x === 24 && y >= 5 && y <= 10) ||
    (y === 5 && x >= 16 && x <= 24) ||
    (x === 10 && y >= 10 && y <= 22) ||
    (y === 22 && x >= 10 && x <= 14)
  ) {
    return 'road'
  }

  if (x === 17 && y <= 19) return 'water'

  if (
    (x >= 22 && x <= 27 && y >= 7 && y <= 14) ||
    (x >= 13 && x <= 16 && y >= 3 && y <= 8) ||
    (x >= 4 && x <= 9 && y >= 7 && y <= 16) ||
    (x >= 6 && x <= 16 && y >= 18 && y <= 24)
  ) {
    return (x + y) % 4 === 0 ? 'woods' : 'deep-woods'
  }

  return (x * 7 + y * 5) % 6 <= 1 ? 'woods' : 'deep-woods'
}

function getTypeScriptFrontierTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= 30 || y >= 20) return 'mountain'
  if (samePosition(position, TS_BOSS_POSITION)) return 'boss'
  if (getTreasureAtPosition(position, TS_FRONTIER_MAP_ID)) return 'treasure'

  if (
    y === 10 ||
    (x === 27 && y >= 4 && y <= 10) ||
    (x === 18 && y >= 6 && y <= 10) ||
    (y === 6 && x >= 18 && x <= 23)
  ) {
    return 'stone'
  }

  if (
    (x >= 4 && x <= 9 && y >= 5 && y <= 15) ||
    (x >= 21 && x <= 25 && y >= 8 && y <= 16)
  ) {
    return (x + y) % 3 === 0 ? 'crystal' : 'ruins'
  }

  return (x * 5 + y * 7) % 5 <= 1 ? 'crystal' : 'ruins'
}

export function getTerrain(
  x: number,
  y: number,
  mapId: WorldMapId = OVERWORLD_MAP_ID,
): Terrain {
  const position = { x, y }
  const portal = getWorldPortalAtPosition(mapId, position)
  if (portal) {
    if (mapId === TS_FRONTIER_MAP_ID) return 'gate'
    if (
      mapId === JS_VILLAGE_MAP_ID ||
      mapId === JS_FOREST_MAP_ID ||
      mapId === JS_DEEP_FOREST_MAP_ID
    ) {
      return 'exit'
    }
    if (portal.toMapId === JS_VILLAGE_MAP_ID) return 'village'
    if (portal.toMapId === TS_FRONTIER_MAP_ID) return 'gate'
    return 'woods'
  }

  if (mapId === JS_VILLAGE_MAP_ID) return getVillageTerrain(x, y)
  if (mapId === JS_FOREST_MAP_ID) return getForestTerrain(x, y)
  if (mapId === JS_DEEP_FOREST_MAP_ID) return getDeepForestTerrain(x, y)
  if (mapId === TS_FRONTIER_MAP_ID) return getTypeScriptFrontierTerrain(x, y)

  if (x <= 0 || y <= 0 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1) return 'mountain'
  if (samePosition(position, JS_BOSS_POSITION)) return 'boss'
  if (samePosition(position, SHOP_POSITION)) return 'shop'
  if (samePosition(position, BYTE_POSITION)) return 'npc'
  if (samePosition(position, RECOVERY_POSITION)) return 'recovery'
  if (getTreasureAtPosition(position, mapId)) return 'treasure'

  const isJavaScriptTrail =
    y === WORLD_START.y && x >= JS_FOREST_POSITION.x + 1 && x < WORLD_START.x
  const isVillageSpur =
    x === JS_VILLAGE_POSITION.x &&
    y > JS_VILLAGE_POSITION.y &&
    y <= WORLD_START.y
  const isCodeCoreApproach =
    x === JS_BOSS_POSITION.x && y > JS_BOSS_POSITION.y && y <= 6
  const isTypeScriptGateApproach =
    y === TS_FRONTIER_GATE_POSITION.y &&
    x > WORLD_START.x &&
    x < TS_FRONTIER_GATE_POSITION.x

  if (isTypeScriptGateApproach) return 'stone'
  if (isJavaScriptTrail || isVillageSpur || isCodeCoreApproach) return 'road'

  if (x >= 18 && x <= 22 && y >= 10 && y <= 17) return 'town'

  if (x >= 4 && x <= 7 && y >= 20 && y <= 23) return 'water'
  if (x === 14 && y >= 5 && y <= 9) return 'mountain'

  const region = getWorldRegion(x, mapId)
  if (region === 'javascript') {
    if (x <= 4) return (x + y) % 4 === 0 ? 'deep-woods' : 'woods'
    if (x <= 7) return (x + y) % 3 === 0 ? 'deep-woods' : 'woods'
    return (x * 3 + y * 5) % 7 <= 2 ? 'tall-grass' : 'grass'
  }
  if (region === 'typescript') return 'town'
  return 'town'
}

export function isWalkableTerrain(terrain: Terrain): boolean {
  return ![
    'mountain',
    'water',
    'boss',
    'midboss',
    'shop',
    'npc',
    'recovery',
    'treasure',
    'house',
    'training',
  ].includes(terrain)
}

export function isEncounterTerrain(terrain: Terrain): boolean {
  return ['tall-grass', 'woods', 'deep-woods', 'forest', 'crystal', 'ruins'].includes(terrain)
}

export function getEncounterChance(terrain: Terrain): number {
  if (terrain === 'tall-grass') return 0.18
  if (terrain === 'woods') return 0.17
  if (terrain === 'deep-woods') return 0.2
  if (terrain === 'forest') return 0.16
  if (terrain === 'crystal') return 0.16
  if (terrain === 'ruins') return 0.17
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
  mapId: WorldMapId = OVERWORLD_MAP_ID,
): number | null {
  if (mapId === JS_DEEP_FOREST_MAP_ID) {
    if (!clearedStageIds.includes(14)) return null
    return clearedStageIds.includes(15) && roll >= 0.5 ? 15 : 14
  }

  if (mapId === JS_FOREST_MAP_ID) {
    if (!clearedStageIds.includes(9) || !clearedStageIds.includes(10)) return null
    if (!clearedStageIds.includes(11)) return 10
    if (!clearedStageIds.includes(12)) return roll < 0.5 ? 10 : 11
    if (!clearedStageIds.includes(14)) {
      if (roll < 1 / 3) return 10
      if (roll < 2 / 3) return 11
      return 12
    }
    if (roll < 0.25) return 10
    if (roll < 0.5) return 11
    if (roll < 0.75) return 12
    return 14
  }

  if (region === 'javascript') {
    const pending = [1, 2].find(
      (battleId) => unlockedStageIds.includes(battleId) && !clearedStageIds.includes(battleId),
    )
    if (pending !== undefined) return pending

    const clearedCandidates = [1, 2].filter((battleId) => clearedStageIds.includes(battleId))
    if (clearedCandidates.length === 0) return null
    const normalizedRoll = Math.max(0, Math.min(0.999999, roll))
    return clearedCandidates[Math.floor(normalizedRoll * clearedCandidates.length)] ?? null
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
