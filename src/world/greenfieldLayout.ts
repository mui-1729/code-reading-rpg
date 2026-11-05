import type { Terrain } from './worldMap'
import { GREENFIELD_WORKSHOP_ENTRANCE, WORLD_BUILDINGS, getWorldBuildingAtPosition } from './worldStructures'

export const GREENFIELD_DIMENSIONS = { width: 31, height: 25 }
export const GREENFIELD_EQUIPMENT_SHOP = GREENFIELD_WORKSHOP_ENTRANCE
export const GREENFIELD_TRAVELER = { x: 22, y: 8 }
export const GREENFIELD_RIVERSIDE_CHEST = { x: 8, y: 21 }

export const GREENFIELD_BUILDINGS = WORLD_BUILDINGS.filter((building) => building.mapId === 'js-village').map((building) => building.bounds)

/** Local streets connect the entry, residential square, workshop, and river loop. */
export function getGreenfieldTerrain(x: number, y: number): Terrain {
  if (x <= 0 || y <= 0 || x >= 30 || y >= 24) return 'fence'
  if (x === GREENFIELD_RIVERSIDE_CHEST.x && y === GREENFIELD_RIVERSIDE_CHEST.y) return 'treasure'
  if (getWorldBuildingAtPosition('js-village', x, y)) return 'house'

  if (
    (x >= 9 && x <= 11 && y <= 23) ||
    (y === 7 && x >= 2 && x <= 28) ||
    (x === 20 && y >= 7 && y <= 20) ||
    (y === 19 && x >= 8 && x <= 27) ||
    (x === 8 && y >= 13 && y <= 20) ||
    ((y === 13 || y === 14) && x >= 6 && x <= 20)
  ) return 'road'
  if (x >= 3 && x <= 6 && y >= 16 && y <= 22) return 'water'
  if (x >= 19 && x <= 28 && y >= 6 && y <= 10) return 'town'
  // The meadow is inhabited scenery. Village walking never draws encounters.
  return (x + y) % 7 === 0 ? 'grass' : 'town'
}
