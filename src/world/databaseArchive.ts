import type { Terrain } from './worldMap'
import { containsWorldFootprint } from './worldStructures'

export const DATABASE_ARCHIVE_MAP_ID = 'database-archive' as const
export const DATABASE_ARCHIVE_DIMENSIONS = { width: 19, height: 15 }
export const DATABASE_ARCHIVE_START = { x: 9, y: 12 }
export const DATABASE_ARCHIVE_EXIT = { x: 9, y: 13 }
export const DATABASE_ARCHIVE_LECTERN = { x: 15, y: 4 }
export const DATABASE_FRONTIER_GATE = { x: 27, y: 16 }
export const DATABASE_SHELVES = [
  { left: 3, right: 5, top: 3, bottom: 4 },
  { left: 11, right: 13, top: 3, bottom: 4 },
  { left: 3, right: 5, top: 8, bottom: 9 },
  { left: 11, right: 13, top: 8, bottom: 9 },
] as const
export const DATABASE_LOCKED_MESSAGE =
  '地下書庫は未開通。JavaScriptのCode CoreとTypeScriptのFRONTIER COMPILERを倒すと、二つの封印が解ける。'

export function getDatabaseArchiveTerrain(x: number, y: number): Terrain {
  if (x <= 0 || y <= 0 || x >= 18 || y >= 14) return 'wall'
  if (x === DATABASE_ARCHIVE_LECTERN.x && y === DATABASE_ARCHIVE_LECTERN.y) return 'lectern'
  if (DATABASE_SHELVES.some((shelf) => containsWorldFootprint(shelf, x, y))) return 'bookshelf'
  if ((x === 9 && y >= 6) || y === 6 || x === 15) return 'road'
  return 'stone'
}
