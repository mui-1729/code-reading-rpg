import type { Terrain, WorldCell, WorldMapId } from './worldMap'

export type Footprint = { left: number; top: number; right: number; bottom: number }
export type WorldBuilding = {
  id: string
  mapId: WorldMapId
  bounds: Footprint
  roof: 'clay' | 'moss' | 'slate'
  entrance?: { x: number; y: number }
}

export const GREENFIELD_WORKSHOP_ENTRANCE = { x: 24, y: 18 }
export const SETTLEMENT_INN_ENTRANCE = { x: 6, y: 13 }
export const SETTLEMENT_SHOP_ENTRANCE = { x: 16, y: 13 }

// These footprints own both collision and the complete building silhouette.
export const WORLD_BUILDINGS: readonly WorldBuilding[] = [
  {
    id: 'greenfield-west-home',
    mapId: 'js-village',
    bounds: { left: 2, right: 5, top: 2, bottom: 5 },
    roof: 'clay',
  },
  {
    id: 'greenfield-north-home',
    mapId: 'js-village',
    bounds: { left: 15, right: 18, top: 2, bottom: 5 },
    roof: 'moss',
  },
  {
    id: 'greenfield-inn',
    mapId: 'js-village',
    bounds: { left: 3, right: 6, top: 9, bottom: 11 },
    roof: 'clay',
    entrance: { x: 5, y: 11 },
  },
  {
    id: 'greenfield-market',
    mapId: 'js-village',
    bounds: { left: 14, right: 17, top: 9, bottom: 11 },
    roof: 'slate',
    entrance: { x: 14, y: 11 },
  },
  {
    id: 'greenfield-east-home',
    mapId: 'js-village',
    bounds: { left: 23, right: 26, top: 2, bottom: 5 },
    roof: 'moss',
  },
  {
    id: 'greenfield-garden-home',
    mapId: 'js-village',
    bounds: { left: 22, right: 25, top: 12, bottom: 14 },
    roof: 'clay',
  },
  {
    id: 'greenfield-workshop',
    mapId: 'js-village',
    bounds: { left: 23, right: 26, top: 16, bottom: 18 },
    roof: 'slate',
    entrance: GREENFIELD_WORKSHOP_ENTRANCE,
  },
  {
    id: 'settlement-west-home',
    mapId: 'js-forest-settlement',
    bounds: { left: 4, right: 7, top: 3, bottom: 6 },
    roof: 'moss',
  },
  {
    id: 'settlement-east-home',
    mapId: 'js-forest-settlement',
    bounds: { left: 15, right: 18, top: 3, bottom: 6 },
    roof: 'moss',
  },
  {
    id: 'settlement-inn',
    mapId: 'js-forest-settlement',
    bounds: { left: 4, right: 7, top: 10, bottom: 13 },
    roof: 'clay',
    entrance: SETTLEMENT_INN_ENTRANCE,
  },
  {
    id: 'settlement-shop',
    mapId: 'js-forest-settlement',
    bounds: { left: 15, right: 18, top: 10, bottom: 13 },
    roof: 'moss',
    entrance: SETTLEMENT_SHOP_ENTRANCE,
  },
]

export const WORLD_LOG_BRIDGES: readonly { id: string; mapId: WorldMapId; bounds: Footprint }[] = [
  {
    id: 'forest-north-log',
    mapId: 'js-forest',
    bounds: { left: 32, right: 33, top: 12, bottom: 12 },
  },
  {
    id: 'forest-south-log',
    mapId: 'js-forest',
    bounds: { left: 30, right: 31, top: 31, bottom: 31 },
  },
  {
    id: 'deep-north-log',
    mapId: 'js-deep-forest',
    bounds: { left: 42, right: 43, top: 14, bottom: 14 },
  },
  {
    id: 'deep-south-log',
    mapId: 'js-deep-forest',
    bounds: { left: 40, right: 41, top: 33, bottom: 33 },
  },
]

export function containsWorldFootprint(bounds: Footprint, x: number, y: number): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
}

export function getWorldBuildingAtPosition(mapId: WorldMapId, x: number, y: number) {
  return WORLD_BUILDINGS.find(
    (building) => building.mapId === mapId && containsWorldFootprint(building.bounds, x, y),
  )
}

export function getWorldLogBridgeAtPosition(mapId: WorldMapId, x: number, y: number) {
  return WORLD_LOG_BRIDGES.find(
    (bridge) => bridge.mapId === mapId && containsWorldFootprint(bridge.bounds, x, y),
  )
}

export type WorldCellObjectKind =
  | 'market-stall'
  | 'inn'
  | 'chest'
  | 'lectern'
  | 'stairs-up'
  | 'stairs-down'
  | 'village'
  | 'village-exit'

export function getWorldCellObjectKind(
  mapId: WorldMapId,
  terrain: Terrain,
): WorldCellObjectKind | undefined {
  if (terrain === 'shop') return 'market-stall'
  if (terrain === 'recovery') return 'inn'
  if (terrain === 'treasure') return 'chest'
  if (terrain === 'lectern' || terrain === 'stairs-up' || terrain === 'stairs-down') return terrain
  if (terrain === 'village') return 'village'
  if (terrain === 'exit' && mapId === 'js-village') return 'village-exit'
  return undefined
}

export function getWorldStructureId(cell: WorldCell): string | undefined {
  return getWorldBuildingAtPosition(cell.mapId, cell.x, cell.y)?.id
}
