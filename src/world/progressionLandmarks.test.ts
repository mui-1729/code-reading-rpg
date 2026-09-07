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
      [10, 38, 16],
      [11, 31, 8],
      [12, 20, 20],
      [14, 10, 12],
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

  it('座標からPlayer-facing landmarkを取得できる', () => {
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 31, y: 8 })).toMatchObject({
      battleId: 11,
      shortLabel: '分かれ道',
    })
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 31, y: 9 })).toBeUndefined()
  })
})
