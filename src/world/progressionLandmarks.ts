import { JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID, type WorldMapId } from './worldMap'

export type ProgressionLandmark = {
  mapId: WorldMapId
  position: { x: number; y: number }
  battleId: number
  label: string
  shortLabel: string
  kind: 'trace' | 'junction' | 'barrier' | 'archive'
}

/**
 * Fixed-story Battles live at visible places instead of invisible x thresholds.
 * Player-facing copy names natural scenery; the field renderer presents these as
 * pixel objects rather than a row of technical signboards.
 */
export const PROGRESSION_LANDMARKS: readonly ProgressionLandmark[] = [
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 30, y: 11 },
    battleId: 11,
    label: '二手へ分かれる獣道',
    shortLabel: '獣道',
    kind: 'trace',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 21, y: 23 },
    battleId: 12,
    label: '倒木の先で道が合流する場所',
    shortLabel: '倒木',
    kind: 'junction',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 7, y: 24 },
    battleId: 14,
    label: '足跡が広がる西の草地',
    shortLabel: '足跡',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 39, y: 9 },
    battleId: 16,
    label: '苔むした倒木の切れ目',
    shortLabel: '倒木',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 27, y: 9 },
    battleId: 17,
    label: '水面が泡立つ浅瀬',
    shortLabel: '浅瀬',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 25, y: 27 },
    battleId: 18,
    label: '太い根が道を囲う場所',
    shortLabel: '根の柵',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 18, y: 15 },
    battleId: 19,
    label: '二本の巨木の根が絡む場所',
    shortLabel: '絡み根',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 13, y: 25 },
    battleId: 20,
    label: '足跡が三方向へ分かれる湿地',
    shortLabel: '足跡',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 9, y: 29 },
    battleId: 21,
    label: '水の途切れた小さな泉',
    shortLabel: '涸れ泉',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 4, y: 17 },
    battleId: 22,
    label: 'すべての根が集まる巨大樹の根元',
    shortLabel: '巨大樹',
    kind: 'junction',
  },
]

export function getProgressionLandmarkAtPosition(
  mapId: WorldMapId,
  position: { x: number; y: number },
): ProgressionLandmark | undefined {
  return PROGRESSION_LANDMARKS.find(
    (landmark) =>
      landmark.mapId === mapId &&
      landmark.position.x === position.x &&
      landmark.position.y === position.y,
  )
}
