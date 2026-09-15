import { describe, expect, it } from 'vitest'
import { getTerrain, isEncounterTerrain, JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID } from './worldMap'
import { getProgressionLandmarkAtPosition, PROGRESSION_LANDMARKS } from './progressionLandmarks'

describe('progression landmarks', () => {
  it('Forestのfixed Battleを横一列ではなく地理上の離れた場所へ対応させる', () => {
    expect(
      PROGRESSION_LANDMARKS.filter((landmark) => landmark.mapId === JS_FOREST_MAP_ID).map(
        (landmark) => [landmark.battleId, landmark.position.x, landmark.position.y],
      ),
    ).toEqual([
      [10, 47, 20],
      [11, 34, 12],
      [12, 22, 25],
      [14, 9, 20],
    ])
  })

  it('Deep Forestの15〜22を東西だけでなく上下にも大きく分散する', () => {
    expect(
      PROGRESSION_LANDMARKS.filter(
        (landmark) => landmark.mapId === JS_DEEP_FOREST_MAP_ID,
      ).map((landmark) => [landmark.battleId, landmark.position.x, landmark.position.y]),
    ).toEqual([
      [15, 57, 31],
      [16, 52, 17],
      [17, 46, 10],
      [18, 37, 20],
      [19, 30, 27],
      [20, 23, 35],
      [21, 15, 28],
      [22, 8, 15],
    ])
  })

  it('全landmarkはfixed Battleを発火できるencounter terrain上に置く', () => {
    for (const landmark of PROGRESSION_LANDMARKS) {
      expect(isEncounterTerrain(getTerrain(landmark.position.x, landmark.position.y, landmark.mapId))).toBe(true)
    }
  })

  it('Forestの痕跡は進行都合の地名ではなく現場で見える物として記述する', () => {
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 34, y: 12 })).toMatchObject({
      battleId: 11,
      shortLabel: '足跡',
      label: '川辺の泥に足跡が残っている',
    })
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 22, y: 25 })).toMatchObject({
      battleId: 12,
      shortLabel: '足跡',
      label: '踏み荒らされた草に足跡が重なっている',
    })
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 35, y: 13 })).toBeUndefined()
  })

  it('Deep Forestもsyntax名やBattle番号ではなく自然物をlandmark名にする', () => {
    expect(getProgressionLandmarkAtPosition(JS_DEEP_FOREST_MAP_ID, { x: 52, y: 17 })).toMatchObject({
      battleId: 16,
      shortLabel: '割れた実',
      label: '割れた実と形の違う種子が一緒に散らばっている',
    })
    expect(getProgressionLandmarkAtPosition(JS_DEEP_FOREST_MAP_ID, { x: 30, y: 27 })).toMatchObject({
      battleId: 19,
      shortLabel: '交差する根',
      label: '二本の巨大な根が交差して奥を塞いでいる',
    })
    expect(getProgressionLandmarkAtPosition(JS_DEEP_FOREST_MAP_ID, { x: 8, y: 15 })).toMatchObject({
      battleId: 22,
      shortLabel: '巨大根',
    })
  })
})
