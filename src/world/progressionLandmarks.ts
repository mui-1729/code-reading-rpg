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
 * Fixed-story Battle thresholds must have a player-visible place in the world.
 * Each landmark sits on encounter terrain directly beside the main trail at the
 * matching progression threshold, so following the visible clue triggers the
 * same fixed Battle instead of asking the player to guess an invisible x value.
 */
export const PROGRESSION_LANDMARKS: readonly ProgressionLandmark[] = [
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 17, y: 9 },
    battleId: 11,
    label: '二手に割れた異変の痕跡',
    shortLabel: '分岐痕',
    kind: 'trace',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 8, y: 9 },
    battleId: 12,
    label: '二つの痕跡が重なる合流点',
    shortLabel: '合流痕',
    kind: 'junction',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: { x: 4, y: 9 },
    battleId: 14,
    label: '守り人の先で広がる複数の足跡',
    shortLabel: '拡散痕',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 24, y: 11 },
    battleId: 16,
    label: '形の違う記録片が散る場所',
    shortLabel: '変換痕',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 19, y: 11 },
    battleId: 17,
    label: '一つの警報灯だけが残る痕跡',
    shortLabel: '警報痕',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 14, y: 9 },
    battleId: 18,
    label: '群れ全体を囲う古い障壁',
    shortLabel: '群れの障壁',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 10, y: 9 },
    battleId: 19,
    label: '二つの根が絡む合流門',
    shortLabel: '根の合流門',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 9, y: 9 },
    battleId: 20,
    label: '優先順を刻んだ石列',
    shortLabel: '順序石',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 7, y: 9 },
    battleId: 21,
    label: '欠けた記録が積まれた場所',
    shortLabel: '欠損記録',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: { x: 5, y: 9 },
    battleId: 22,
    label: 'すべての痕跡が一本へ集まる根',
    shortLabel: '集約根',
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
