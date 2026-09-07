import { JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID, type WorldMapId } from './worldMap'

export type WorldRecoveryStop = {
  id: string
  mapId: WorldMapId
  label: string
  actionLabel: string
  position: { x: number; y: number }
  recoveryRatio: number
}

/**
 * Recovery stops are optional safety valves, not paid Inn replacements.
 * Forest Phase 4 moves the camp off the main route onto a rejoining southern
 * loop so exploration has a practical reward without making the story path mandatory.
 */
export const WORLD_RECOVERY_STOPS: readonly WorldRecoveryStop[] = [
  {
    id: 'forest-traveler-camp',
    mapId: JS_FOREST_MAP_ID,
    label: '野営地',
    actionLabel: '野営地で休む',
    position: { x: 19, y: 26 },
    recoveryRatio: 0.6,
  },
  {
    id: 'deep-forest-spring',
    mapId: JS_DEEP_FOREST_MAP_ID,
    label: '湧き水',
    actionLabel: '湧き水で休む',
    position: { x: 16, y: 11 },
    recoveryRatio: 0.6,
  },
] as const
