import {
  JS_DEEP_FOREST_LEARNING_POSITIONS,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_LEARNING_POSITIONS,
  JS_FOREST_MAP_ID,
  type WorldMapId,
} from './worldMap'

export type ProgressionLandmark = {
  mapId: WorldMapId
  position: { x: number; y: number }
  battleId: number
  label: string
  shortLabel: string
  kind: 'trace' | 'junction' | 'barrier' | 'archive'
}

/**
 * Fixed-story Battles are tied to places the player can recognize in the field.
 * Labels describe the scenery for accessibility; CSS renders the physical clue
 * itself instead of painting developer-facing Battle names onto the map.
 */
export const PROGRESSION_LANDMARKS: readonly ProgressionLandmark[] = [
  {
    mapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_LEARNING_POSITIONS[10],
    battleId: 10,
    label: '折れた枝が地面に散らばっている',
    shortLabel: '折れ枝',
    kind: 'trace',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_LEARNING_POSITIONS[11],
    battleId: 11,
    label: '川辺の泥に足跡が残っている',
    shortLabel: '足跡',
    kind: 'trace',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_LEARNING_POSITIONS[12],
    battleId: 12,
    label: '踏み荒らされた草に足跡が重なっている',
    shortLabel: '足跡',
    kind: 'junction',
  },
  {
    mapId: JS_FOREST_MAP_ID,
    position: JS_FOREST_LEARNING_POSITIONS[14],
    battleId: 14,
    label: '木々の間へ複数の足跡が続いている',
    shortLabel: '足跡',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[15],
    battleId: 15,
    label: '湿った地面に同じ足跡が何本も重なっている',
    shortLabel: '湿地の足跡',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[16],
    battleId: 16,
    label: '割れた実と形の違う種子が一緒に散らばっている',
    shortLabel: '割れた実',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[17],
    battleId: 17,
    label: '鳥が一斉に飛び立った羽根の跡が残っている',
    shortLabel: '散った羽根',
    kind: 'trace',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[18],
    battleId: 18,
    label: '太い根が円を描くように広場を囲んでいる',
    shortLabel: '根囲い',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[19],
    battleId: 19,
    label: '二本の巨大な根が交差して奥を塞いでいる',
    shortLabel: '交差する根',
    kind: 'barrier',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[20],
    battleId: 20,
    label: '倒木に大きさの違う爪痕が順に残っている',
    shortLabel: '爪痕の倒木',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[21],
    battleId: 21,
    label: '苔むした根の一部だけが空洞になっている',
    shortLabel: '根の空洞',
    kind: 'archive',
  },
  {
    mapId: JS_DEEP_FOREST_MAP_ID,
    position: JS_DEEP_FOREST_LEARNING_POSITIONS[22],
    battleId: 22,
    label: '周囲の巨大根が一本の幹へ集まっている',
    shortLabel: '巨大根',
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
