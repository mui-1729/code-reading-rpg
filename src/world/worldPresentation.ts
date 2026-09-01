import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  type WorldMapId,
} from './worldMap'

export type WorldFacing = 'up' | 'down' | 'left' | 'right'
export type WorldFieldTrack =
  | 'field'
  | 'fieldVillage'
  | 'fieldForest'
  | 'fieldDeepForest'
  | 'fieldTypeScript'

export const WORLD_STEP_MS = 150
export const WORLD_ENTRY_TITLE_MS = 720

const WORLD_SCENES: Record<
  WorldMapId,
  { sceneId: string; title: string; bgmTrack: WorldFieldTrack }
> = {
  [OVERWORLD_MAP_ID]: {
    sceneId: 'javascript-grassland',
    title: 'JAVASCRIPT GRASSLAND',
    bgmTrack: 'field',
  },
  [JS_VILLAGE_MAP_ID]: {
    sceneId: 'greenfield-village',
    title: 'GREENFIELD VILLAGE',
    bgmTrack: 'fieldVillage',
  },
  [JS_FOREST_MAP_ID]: {
    sceneId: 'javascript-forest',
    title: 'JAVASCRIPT FOREST',
    bgmTrack: 'fieldForest',
  },
  [JS_DEEP_FOREST_MAP_ID]: {
    sceneId: 'javascript-deep-forest',
    title: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'fieldDeepForest',
  },
  [TS_FRONTIER_MAP_ID]: {
    sceneId: 'typescript-frontier',
    title: 'TYPESCRIPT FRONTIER',
    bgmTrack: 'fieldTypeScript',
  },
}

export function getWorldFacing(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fallback: WorldFacing = 'down',
): WorldFacing {
  const dx = to.x - from.x
  const dy = to.y - from.y

  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right'
  if (dy !== 0) return dy < 0 ? 'up' : 'down'
  return fallback
}

export function isAdjacentWorldStep(
  from: { x: number; y: number },
  to: { x: number; y: number },
): boolean {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y) === 1
}

export function getWorldScenePresentation(mapId: WorldMapId) {
  return WORLD_SCENES[mapId]
}
