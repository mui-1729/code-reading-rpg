import type { RpgState, WorldPosition } from '../rpg/state'
import {
  getWorldMapDimensions,
  isWorldMapId,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  type Terrain,
  type WorldMapId,
} from './worldMap'

export const WORLD_REVEAL_RADIUS = 2

export type RevealedWorldCells = Partial<Record<WorldMapId, string[]>>

export function encodeWorldCell(position: WorldPosition): string {
  return `${position.x}:${position.y}`
}

function decodeWorldCell(value: string): WorldPosition | null {
  const match = /^(\d+):(\d+)$/.exec(value)
  if (!match) return null
  const x = Number(match[1])
  const y = Number(match[2])
  return Number.isInteger(x) && Number.isInteger(y) ? { x, y } : null
}

function isCellInBounds(mapId: WorldMapId, position: WorldPosition): boolean {
  const { width, height } = getWorldMapDimensions(mapId)
  return position.x >= 0 && position.y >= 0 && position.x < width && position.y < height
}

export function normalizeRevealedWorldCells(value: unknown): RevealedWorldCells {
  if (!value || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>
  const normalized: RevealedWorldCells = {}

  for (const [mapIdValue, cellsValue] of Object.entries(source)) {
    if (!isWorldMapId(mapIdValue) || !Array.isArray(cellsValue)) continue
    const cells = Array.from(new Set(cellsValue.filter((cell): cell is string => {
      if (typeof cell !== 'string') return false
      const position = decodeWorldCell(cell)
      return position !== null && isCellInBounds(mapIdValue, position)
    })))
    if (cells.length > 0) normalized[mapIdValue] = cells
  }

  return normalized
}

export function normalizeOwnedWorldMapIds(value: unknown): WorldMapId[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((mapId): mapId is WorldMapId =>
    typeof mapId === 'string' && isWorldMapId(mapId),
  )))
}

export function revealWorldPosition(
  state: RpgState,
  radius = WORLD_REVEAL_RADIUS,
): RpgState {
  const safeRadius = Math.max(0, Math.floor(radius))
  const existing = new Set(state.revealedWorldCells[state.worldMapId] ?? [])
  const { width, height } = getWorldMapDimensions(state.worldMapId)

  for (let y = state.worldPosition.y - safeRadius; y <= state.worldPosition.y + safeRadius; y += 1) {
    for (let x = state.worldPosition.x - safeRadius; x <= state.worldPosition.x + safeRadius; x += 1) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue
      existing.add(encodeWorldCell({ x, y }))
    }
  }

  const nextCells = Array.from(existing)
  const previous = state.revealedWorldCells[state.worldMapId] ?? []
  if (nextCells.length === previous.length && nextCells.every((cell) => previous.includes(cell))) {
    return state
  }

  return {
    ...state,
    revealedWorldCells: {
      ...state.revealedWorldCells,
      [state.worldMapId]: nextCells,
    },
  }
}

export function isWorldCellRevealed(
  state: Pick<RpgState, 'revealedWorldCells'>,
  mapId: WorldMapId,
  position: WorldPosition,
): boolean {
  return (state.revealedWorldCells[mapId] ?? []).includes(encodeWorldCell(position))
}

export function hasWorldMapChart(
  state: Pick<RpgState, 'ownedWorldMapIds'>,
  mapId: WorldMapId,
): boolean {
  return state.ownedWorldMapIds.includes(mapId)
}

export function isWorldTerrainVisible(
  state: Pick<RpgState, 'revealedWorldCells' | 'ownedWorldMapIds'>,
  mapId: WorldMapId,
  position: WorldPosition,
): boolean {
  return hasWorldMapChart(state, mapId) || isWorldCellRevealed(state, mapId, position)
}

export function getChartSafeTerrain(mapId: WorldMapId, terrain: Terrain): Terrain {
  if (!['treasure', 'boss', 'midboss', 'training'].includes(terrain)) return terrain
  if (mapId === JS_FOREST_MAP_ID) return 'woods'
  if (mapId === JS_DEEP_FOREST_MAP_ID) return 'deep-woods'
  if (mapId === TS_FRONTIER_MAP_ID) return 'stone'
  if (mapId === OVERWORLD_MAP_ID) return 'grass'
  return 'grass'
}
