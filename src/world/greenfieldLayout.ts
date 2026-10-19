import type { Terrain } from './worldMap'

export const GREENFIELD_DIMENSIONS = { width: 31, height: 25 }
export const GREENFIELD_EQUIPMENT_SHOP = { x: 24, y: 18 }
export const GREENFIELD_TRAVELER = { x: 22, y: 8 }
export const GREENFIELD_RIVERSIDE_CHEST = { x: 8, y: 21 }

export const GREENFIELD_BUILDINGS = [
  { left: 2, right: 5, top: 2, bottom: 5 },
  { left: 15, right: 18, top: 2, bottom: 5 },
  { left: 3, right: 6, top: 9, bottom: 11 },
  { left: 14, right: 17, top: 9, bottom: 11 },
  { left: 23, right: 26, top: 2, bottom: 5 },
  { left: 22, right: 25, top: 12, bottom: 14 },
  { left: 23, right: 26, top: 16, bottom: 18 },
] as const

/** Local streets connect the entry, residential square, workshop, and river loop. */
export function getGreenfieldTerrain(x: number, y: number): Terrain {
  if (x <= 0 || y <= 0 || x >= 30 || y >= 24) return 'mountain'
  if (x === GREENFIELD_RIVERSIDE_CHEST.x && y === GREENFIELD_RIVERSIDE_CHEST.y) return 'treasure'
  if (GREENFIELD_BUILDINGS.some((building) =>
    x >= building.left && x <= building.right && y >= building.top && y <= building.bottom,
  )) return 'house'

  if (
    (x >= 9 && x <= 11 && y <= 14) ||
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
