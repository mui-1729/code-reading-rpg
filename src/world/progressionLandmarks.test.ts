import { describe, expect, it } from 'vitest'
import { getTerrain, isEncounterTerrain, JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID } from './worldMap'
import { getProgressionLandmarkAtPosition, PROGRESSION_LANDMARKS } from './progressionLandmarks'

describe('progression landmarks', () => {
  it('Forestのfixed Battleを本道から見つけられる3つの自然landmarkへ分散する', () => {
    expect(
      PROGRESSION_LANDMARKS.filter((landmark) => landmark.mapId === JS_FOREST_MAP_ID).map(
        (landmark) => [landmark.battleId, landmark.position.x, landmark.position.y],
      ),
    ).toEqual([
      [11, 30, 11],
      [12, 21, 23],
      [14, 7, 24],
    ])
  })

  it('Deep Forestのmajor Battleを蛇行route上の別々の景観へ対応させる', () => {
    expect(
      PROGRESSION_LANDMARKS.filter(
        (landmark) => landmark.mapId === JS_DEEP_FOREST_MAP_ID,
      ).map((landmark) => [landmark.battleId, landmark.position.x, landmark.position.y]),
    ).toEqual([
      [16, 39, 9],
      [17, 27, 9],
      [18, 25, 27],
      [19, 18, 15],
      [20, 13, 25],
      [21, 9, 29],
      [22, 4, 17],
    ])
  })

  it('全landmarkはfixed Battleを実際に発火できるencounter terrain上に置く', () => {
    for (const landmark of PROGRESSION_LANDMARKS) {
      expect(isEncounterTerrain(getTerrain(landmark.position.x, landmark.position.y, landmark.mapId))).toBe(true)
    }
  })

  it('座標から技術signではなくPlayer-facingな自然landmarkを取得できる', () => {
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 30, y: 11 })).toMatchObject({
      battleId: 11,
      shortLabel: '獣道',
      label: '二手へ分かれる獣道',
    })
    expect(getProgressionLandmarkAtPosition(JS_FOREST_MAP_ID, { x: 30, y: 12 })).toBeUndefined()
  })
})
