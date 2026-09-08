export const WORLD_WIDTH = 70
export const WORLD_HEIGHT = 50
export const VIEWPORT_WIDTH = 11
export const VIEWPORT_HEIGHT = 9
export const WORLD_START = { x: 20, y: 14 } as const

export const OVERWORLD_MAP_ID = 'overworld' as const
export const JS_VILLAGE_MAP_ID = 'js-village' as const
export const JS_FOREST_MAP_ID = 'js-forest' as const
export const JS_FOREST_SETTLEMENT_MAP_ID = 'js-forest-settlement' as const
export const JS_DEEP_FOREST_MAP_ID = 'js-deep-forest' as const
export const TS_FRONTIER_MAP_ID = 'ts-frontier' as const
export type WorldMapId =
  | typeof OVERWORLD_MAP_ID
  | typeof JS_VILLAGE_MAP_ID
  | typeof JS_FOREST_MAP_ID
  | typeof JS_FOREST_SETTLEMENT_MAP_ID
  | typeof JS_DEEP_FOREST_MAP_ID
  | typeof TS_FRONTIER_MAP_ID

const WORLD_MAP_DIMENSIONS: Record<WorldMapId, { width: number; height: number }> = {
  [OVERWORLD_MAP_ID]: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  [JS_VILLAGE_MAP_ID]: { width: 21, height: 15 },
  [JS_FOREST_MAP_ID]: { width: 55, height: 41 },
  [JS_FOREST_SETTLEMENT_MAP_ID]: { width: 23, height: 17 },
  [JS_DEEP_FOREST_MAP_ID]: { width: 31, height: 27 },
  [TS_FRONTIER_MAP_ID]: { width: 31, height: 21 },
}

export const WORLD_MAP_STARTS: Record<WorldMapId, { x: number; y: number }> = {
  [OVERWORLD_MAP_ID]: { ...WORLD_START },
  [JS_VILLAGE_MAP_ID]: { x: 10, y: 12 },
  [JS_FOREST_MAP_ID]: { x: 52, y: 20 },
  [JS_FOREST_SETTLEMENT_MAP_ID]: { x: 20, y: 8 },
  [JS_DEEP_FOREST_MAP_ID]: { x: 28, y: 10 },
  [TS_FRONTIER_MAP_ID]: { x: 2, y: 10 },
}

export type WorldRegion = 'javascript' | 'hub' | 'typescript'
export type Terrain =
  | 'mountain'
  | 'water'
  | 'log-crossing'
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
  | 'thicket'
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

export const JS_BOSS_POSITION = { x: 40, y: 5 } as const
export const TS_BOSS_POSITION = { x: 27, y: 4 } as const
export const SHOP_POSITION = { x: 20, y: 12 } as const
export const BYTE_POSITION = { x: 19, y: 13 } as const
export const RECOVERY_POSITION = { x: 21, y: 16 } as const
export const JS_VILLAGE_POSITION = { x: 10, y: 22 } as const
export const JS_VILLAGE_EXIT_POSITION = { x: 10, y: 14 } as const
export const JS_VILLAGE_TRAINING_POSITION = { x: 12, y: 7 } as const
export const JS_FOREST_POSITION = { x: 34, y: 34 } as const
export const JS_FOREST_EXIT_POSITION = { x: 54, y: 20 } as const
export const JS_FOREST_MIDBOSS_POSITION = { x: 15, y: 16 } as const
export const JS_FOREST_SETTLEMENT_POSITION = { x: 1, y: 23 } as const
// Compatibility alias while callers move from the old Forest -> Deep Forest direct topology.
export const JS_FOREST_DEEP_FOREST_POSITION = JS_FOREST_SETTLEMENT_POSITION
export const JS_FOREST_SETTLEMENT_FOREST_EXIT_POSITION = { x: 22, y: 8 } as const
export const JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION = { x: 11, y: 1 } as const
export const JS_DEEP_FOREST_EXIT_POSITION = { x: 30, y: 10 } as const
export const JS_DEEP_FOREST_CORE_EXIT_POSITION = { x: 1, y: 10 } as const
export const TS_FRONTIER_GATE_POSITION = { x: 62, y: 14 } as const
export const TS_FRONTIER_EXIT_POSITION = { x: 1, y: 10 } as const

export const JS_FOREST_LEARNING_POSITIONS = {
  10: { x: 47, y: 20 },
  11: { x: 34, y: 12 },
  12: { x: 22, y: 25 },
  14: { x: 9, y: 20 },
} as const

export const WORLD_TREASURES = [
  {
    id: 'js-debug-cache',
    name: 'DEBUG CACHE',
    mapId: OVERWORLD_MAP_ID,
    position: { x: 8, y: 33 },
    region: 'javascript',
  },
  {
    id: 'js-forest-supply',
    name: 'FOREST SUPPLY',
    mapId: JS_FOREST_MAP_ID,
    position: { x: 40, y: 6 },
    region: 'javascript',
  },
  {
    id: 'js-deep-forest-cache',
    name: 'DEEP CACHE',
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 14, y: 22 },
    region: 'javascript',
  },
  {
    id: 'ts-supply-cache',
    name: 'TYPE CACHE',
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
    label: 'グリーンフィールド村',
    requiredClearedStageId: 1,
  },
  {
    fromMapId: JS_VILLAGE_MAP_ID,
    position: JS_VILLAGE_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 10, y: 21 },
    label: 'JavaScript草原',
  },
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: JS_FOREST_POSITION,
    toMapId: JS_FOREST_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_FOREST_MAP_ID],
    label: 'JavaScriptの森',
    requiredClearedStageId: 9,
  },
  {
    fromMapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 34, y: 33 },
    label: 'JavaScript草原',
  },
  {
    fromMapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_SETTLEMENT_POSITION,
    toMapId: JS_FOREST_SETTLEMENT_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_FOREST_SETTLEMENT_MAP_ID],
    label: '森番の集落',
    requiredClearedStageId: 14,
  },
  {
    fromMapId: JS_FOREST_SETTLEMENT_MAP_ID,
    position: JS_FOREST_SETTLEMENT_FOREST_EXIT_POSITION,
    toMapId: JS_FOREST_MAP_ID,
    targetPosition: { x: 2, y: 23 },
    label: 'JavaScriptの森',
  },
  {
    fromMapId: JS_FOREST_SETTLEMENT_MAP_ID,
    position: JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION,
    toMapId: JS_DEEP_FOREST_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID],
    label: 'JavaScript深層の森',
    requiredClearedStageId: 14,
  },
  {
    fromMapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_EXIT_POSITION,
    toMapId: JS_FOREST_SETTLEMENT_MAP_ID,
    targetPosition: { x: 11, y: 2 },
    label: '森番の集落',
  },
  {
    fromMapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_CORE_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 40, y: 8 },
    label: 'Code Core前',
    requiredClearedStageId: 22,
  },
  {
    fromMapId: OVERWORLD_MAP_ID,
    position: TS_FRONTIER_GATE_POSITION,
    toMapId: TS_FRONTIER_MAP_ID,
    targetPosition: WORLD_MAP_STARTS[TS_FRONTIER_MAP_ID],
    label: 'TypeScript辺境',
    requiredClearedStageId: 3,
  },
  {
    fromMapId: TS_FRONTIER_MAP_ID,
    position: TS_FRONTIER_EXIT_POSITION,
    toMapId: OVERWORLD_MAP_ID,
    targetPosition: { x: 61, y: 14 },
    label: '中央Hub',
  },
]

const samePosition = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x && a.y === b.y

export function isWorldMapId(value: unknown): value is WorldMapId {
  return (
    value === OVERWORLD_MAP_ID ||
    value === JS_VILLAGE_MAP_ID ||
    value === JS_FOREST_MAP_ID ||
    value === JS_FOREST_SETTLEMENT_MAP_ID ||
    value === JS_DEEP_FOREST_MAP_ID ||
    value === TS_FRONTIER_MAP_ID
  )
}

export function getWorldMapDimensions(mapId: WorldMapId) {
  return WORLD_MAP_DIMENSIONS[mapId]
}

export function getWorldMapLabel(mapId: WorldMapId) {
  if (mapId === JS_VILLAGE_MAP_ID) return 'グリーンフィールド村'
  if (mapId === JS_FOREST_MAP_ID) return 'JavaScriptの森'
  if (mapId === JS_FOREST_SETTLEMENT_MAP_ID) return '森番の集落'
  if (mapId === JS_DEEP_FOREST_MAP_ID) return 'JavaScript深層の森'
  if (mapId === TS_FRONTIER_MAP_ID) return 'TypeScript辺境'
  return 'JavaScript草原'
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
    mapId === JS_FOREST_SETTLEMENT_MAP_ID ||
    mapId === JS_DEEP_FOREST_MAP_ID
  ) {
    return 'javascript'
  }
  if (x >= 52) return 'typescript'
  if (x >= 18 && x <= 24) return 'hub'
  return 'javascript'
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

function isForestLearningPosition(position: { x: number; y: number }): boolean {
  return Object.values(JS_FOREST_LEARNING_POSITIONS).some((candidate) => samePosition(position, candidate))
}

function inRect(
  x: number,
  y: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): boolean {
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function isForestEntryClearing(x: number, y: number): boolean {
  if (y === 17) return x >= 50 && x <= 52
  if (y === 18) return x >= 48 && x <= 53
  if (y >= 19 && y <= 22) return x >= 49 && x <= 53
  if (y === 23) return x >= 48 && x <= 52
  if (y === 24) return x >= 49 && x <= 51
  return false
}

function isForestTreasureClearing(x: number, y: number): boolean {
  if (y === 4) return x >= 39 && x <= 42
  if (y >= 5 && y <= 7) return x >= 37 && x <= 44
  if (y === 8) return x >= 38 && x <= 43
  if (y === 9) return x >= 39 && x <= 42
  return false
}

function isForestRiverbankClearing(x: number, y: number): boolean {
  if (y >= 9 && y <= 11) return x >= 35 && x <= 39
  if (y >= 12 && y <= 14) return x >= 34 && x <= 40
  if (y >= 15 && y <= 16) return x >= 36 && x <= 40
  return false
}

function isForestCentralClearing(x: number, y: number): boolean {
  if (y >= 22 && y <= 23) return x >= 24 && x <= 28
  if (y >= 24 && y <= 27) return x >= 23 && x <= 29
  if (y >= 28 && y <= 29) return x >= 21 && x <= 27
  return false
}

function isForestCampClearing(x: number, y: number): boolean {
  if (y === 29) return x >= 21 && x <= 24
  if (y >= 30 && y <= 34) return x >= 18 && x <= 26
  if (y === 35) return x >= 20 && x <= 24
  return false
}

function isForestMidbossClearing(x: number, y: number): boolean {
  if (y === 13) return x >= 14 && x <= 16
  if (y >= 14 && y <= 18) return x >= 12 && x <= 18
  if (y >= 19 && y <= 20) return x >= 11 && x <= 16
  return false
}

function isForestSettlementClearing(x: number, y: number): boolean {
  if (y === 18) return x >= 6 && x <= 9
  if (y >= 19 && y <= 24) return x >= 3 && x <= 10
  if (y >= 25 && y <= 26) return x >= 2 && x <= 8
  return false
}

function getForestRiverX(y: number): number | null {
  if (y >= 1 && y <= 9) return 33
  if (y >= 10 && y <= 16) return 32
  if (y >= 17 && y <= 24) return 31
  if (y >= 25 && y <= 32) return 30
  if (y >= 33 && y <= 39) return 29
  return null
}

function isForestRiverCrossing(x: number, y: number): boolean {
  if (y !== 12) return false
  const riverX = getForestRiverX(y)
  return riverX !== null && (x === riverX || x === riverX + 1)
}

function isForestRiver(x: number, y: number): boolean {
  const riverX = getForestRiverX(y)
  if (riverX === null || isForestRiverCrossing(x, y)) return false
  return x === riverX || x === riverX + 1
}

function isForestPond(x: number, y: number): boolean {
  const easternPond =
    inRect(x, y, 45, 47, 26, 33) ||
    inRect(x, y, 44, 48, 28, 31)
  const westernPond =
    inRect(x, y, 7, 9, 28, 36) ||
    inRect(x, y, 6, 10, 30, 34)
  const centralPool =
    inRect(x, y, 22, 23, 13, 18) ||
    inRect(x, y, 21, 24, 14, 16)
  return easternPond || westernPond || centralPool
}

const FOREST_THICKET_BARRIERS = [
  {
    gateY: 20,
    segments: [
      [1, 8, 46],
      [9, 18, 47],
      [19, 24, 46],
      [25, 32, 46],
      [33, 39, 47],
    ],
  },
  {
    gateY: 25,
    segments: [
      [1, 8, 21],
      [9, 18, 22],
      [19, 29, 21],
      [30, 39, 22],
    ],
  },
  {
    gateY: 16,
    segments: [
      [1, 10, 14],
      [11, 20, 15],
      [21, 30, 14],
      [31, 39, 15],
    ],
  },
  {
    gateY: 20,
    segments: [
      [1, 10, 8],
      [11, 24, 9],
      [25, 34, 8],
      [35, 39, 9],
    ],
  },
] as const

function isForestThicketBarrier(x: number, y: number): boolean {
  for (const barrier of FOREST_THICKET_BARRIERS) {
    if (y === barrier.gateY) continue
    const segment = barrier.segments.find(([minY, maxY]) => y >= minY && y <= maxY)
    if (!segment) continue
    const leftX = segment[2]
    if (x === leftX || x === leftX + 1) return true
  }
  return false
}

function isForestDeepWoods(x: number, y: number): boolean {
  const northWest =
    inRect(x, y, 3, 17, 2, 10) ||
    inRect(x, y, 2, 15, 4, 12)
  const northCenter =
    inRect(x, y, 19, 27, 2, 7) ||
    inRect(x, y, 17, 24, 3, 9)
  const southWest =
    inRect(x, y, 2, 13, 27, 38) ||
    inRect(x, y, 4, 15, 29, 37)
  const midWest =
    inRect(x, y, 11, 18, 22, 28) ||
    inRect(x, y, 13, 20, 24, 26)
  return northWest || northCenter || southWest || midWest
}

function isForestGrassClearing(x: number, y: number): boolean {
  return (
    isForestEntryClearing(x, y) ||
    isForestTreasureClearing(x, y) ||
    isForestRiverbankClearing(x, y) ||
    isForestCentralClearing(x, y) ||
    isForestCampClearing(x, y) ||
    isForestMidbossClearing(x, y) ||
    isForestSettlementClearing(x, y)
  )
}

function getForestTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= 54 || y >= 40) return 'mountain'
  if (samePosition(position, JS_FOREST_MIDBOSS_POSITION)) return 'midboss'
  if (getTreasureAtPosition(position, JS_FOREST_MAP_ID)) return 'treasure'

  if (isForestRiverCrossing(x, y)) return 'log-crossing'

  // Each learning encounter sits in the only natural passage to the next
  // exploration section, so it can be discovered through play but not skipped.
  if (isForestLearningPosition(position)) return 'woods'

  // Forest geography is hand-authored in large shapes. No coordinate noise is
  // used to alternate grass / woods / deep-woods tile-by-tile.
  if (isForestRiver(x, y) || isForestPond(x, y)) return 'water'
  if (isForestThicketBarrier(x, y)) return 'thicket'
  if (isForestGrassClearing(x, y)) return 'grass'
  if (isForestDeepWoods(x, y)) return 'deep-woods'
  return 'woods'
}

function getForestSettlementTerrain(x: number, y: number): Terrain {
  if (x <= 0 || y <= 0 || x >= 22 || y >= 16) return 'mountain'

  if (
    (x >= 4 && x <= 7 && y >= 3 && y <= 6) ||
    (x >= 15 && x <= 18 && y >= 3 && y <= 6) ||
    (x >= 4 && x <= 7 && y >= 10 && y <= 13) ||
    (x >= 15 && x <= 18 && y >= 10 && y <= 13)
  ) {
    return 'house'
  }

  if (x === 3 && y >= 2 && y <= 14) return 'water'
  if ((x >= 4 && x <= 21 && y === 8) || (x === 11 && y >= 1 && y <= 14)) return 'road'
  if (x >= 9 && x <= 13 && y >= 6 && y <= 11) return 'town'
  // Keep the whole inhabited settlement encounter-free. Woodland identity is scenery,
  // not Encounter terrain; the dangerous woods begin again after the north portal.
  return 'grass'
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

function isOverworldRoad(x: number, y: number) {
  const arrivalToVillage =
    (y === 14 && x >= 12 && x <= WORLD_START.x) ||
    (x === 12 && y >= 14 && y <= 22) ||
    (y === 22 && x >= JS_VILLAGE_POSITION.x && x <= 28)
  const forestApproach =
    (x === 28 && y >= 22 && y <= 31) ||
    (y === 31 && x >= 28 && x <= JS_FOREST_POSITION.x) ||
    (x === JS_FOREST_POSITION.x && y >= 31 && y <= JS_FOREST_POSITION.y)
  const riversideLoop =
    (x === 12 && y >= 22 && y <= 34) ||
    (y === 34 && x >= 7 && x <= 12) ||
    (x === 7 && y >= 26 && y <= 34) ||
    (y === 26 && x >= 7 && x <= 12)
  const codeCoreApproach = x === JS_BOSS_POSITION.x && y >= 6 && y <= 10
  return arrivalToVillage || forestApproach || riversideLoop || codeCoreApproach
}

function getOverworldTerrain(x: number, y: number): Terrain {
  const position = { x, y }
  if (x <= 0 || y <= 0 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1) return 'mountain'
  if (samePosition(position, JS_BOSS_POSITION)) return 'boss'
  if (samePosition(position, SHOP_POSITION)) return 'shop'
  if (samePosition(position, BYTE_POSITION)) return 'npc'
  if (samePosition(position, RECOVERY_POSITION)) return 'recovery'
  if (getTreasureAtPosition(position, OVERWORLD_MAP_ID)) return 'treasure'

  if (y === TS_FRONTIER_GATE_POSITION.y && x > WORLD_START.x && x < TS_FRONTIER_GATE_POSITION.x) {
    return x >= 52 ? 'stone' : 'road'
  }
  if (isOverworldRoad(x, y)) return 'road'

  if (x >= 17 && x <= 23 && y >= 10 && y <= 17) return 'town'

  // A north-south river separates the first grassland from the forest road.
  // The road checks above create two visible bridges at y=22 / y=31.
  if (x === 25 && y >= 18 && y <= 44) return 'water'
  if (x >= 5 && x <= 9 && y >= 36 && y <= 39) return 'water'

  // A ridge prevents the field from reading as one flat rectangle and funnels
  // the main route toward the bridge without hiding the destination.
  if (x >= 30 && x <= 32 && y >= 18 && y <= 27) return 'mountain'

  if (x >= 29 && x <= 39 && y >= 27 && y <= 40) {
    return (x + y) % 4 === 0 ? 'deep-woods' : 'woods'
  }

  const region = getWorldRegion(x, OVERWORLD_MAP_ID)
  if (region === 'typescript') return 'town'
  if (region === 'hub') return 'town'
  return (x * 3 + y * 5) % 7 <= 2 ? 'tall-grass' : 'grass'
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
      mapId === JS_FOREST_SETTLEMENT_MAP_ID ||
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
  if (mapId === JS_FOREST_SETTLEMENT_MAP_ID) return getForestSettlementTerrain(x, y)
  if (mapId === JS_DEEP_FOREST_MAP_ID) return getDeepForestTerrain(x, y)
  if (mapId === TS_FRONTIER_MAP_ID) return getTypeScriptFrontierTerrain(x, y)
  return getOverworldTerrain(x, y)
}

export function isWalkableTerrain(terrain: Terrain): boolean {
  return ![
    'mountain',
    'water',
    'thicket',
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
