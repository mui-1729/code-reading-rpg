import { describe, expect, it } from 'vitest'
import { getTerrain, isEncounterTerrain, JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID } from './worldMap'
import { getProgressionLandmarkAtPosition, PROGRESSION_LANDMARKS } from './progressionLandmarks'

describe('progression landmarks', () => {
  it('Forestのhidden thresholdを本道脇の調査可能な地点へ対応させる', () => {
    expect(
      PROGRESSION_LANDMARKS.filter((landmark) => landmark.mapId === JS_FOREST_MAP_ID).map(
        (landmark) => [landmark.battleId, landmark.position.x, landmark.position.y],
      ),
    ).toEqual([
      [11, 17, 9],
      [12, 8, 9],
      [14, 4, 9],
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

  it('全landmarkは既存fixed Battleを発火できるencounter terrain上に置く', () => {
    for (const landmark of PROGRESSION_LANDMARKS) {
      expect(isEncounterTerrain(getTerrain(landmark.position.x, landmark.position.y, landmark.mapId))).toBe(true)
    }
  })

  it('座標からPlayer-facing landmarkを取得できる', () => {
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 17, y: 9 })).toMatchObject({
      battleId: 11,
      shortLabel: '分岐痕',
    })
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 17, y: 10 })).toBeUndefined()
  })
})
