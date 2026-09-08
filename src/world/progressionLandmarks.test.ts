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
      [11, 33, 12],
      [12, 22, 25],
      [14, 9, 20],
    ])
  })

  it('Deep Forestの各major thresholdを西へ続くlandmarkへ対応させる', () => {
    expect(
      PROGRESSION_LANDMARKS.filter(
        (landmark) => landmark.mapId === JS_DEEP_FOREST_MAP_ID,
      ).map((landmark) => [landmark.battleId, landmark.position.x]),
    ).toEqual([
      [16, 24],
      [17, 19],
      [18, 14],
      [19, 10],
      [20, 9],
      [21, 7],
      [22, 5],
    ])
  })

  it('全landmarkはfixed Battleを発火できるencounter terrain上に置く', () => {
    for (const landmark of PROGRESSION_LANDMARKS) {
      expect(isEncounterTerrain(getTerrain(landmark.position.x, landmark.position.y, landmark.mapId))).toBe(true)
    }
  })

  it('Forestの痕跡は進行都合の地名ではなく現場で見える物として記述する', () => {
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 33, y: 12 })).toMatchObject({
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
})
