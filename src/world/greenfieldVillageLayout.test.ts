import { describe, expect, it } from 'vitest'
import { VILLAGE_FACILITIES } from './villageFacilityData'
import {
  getTerrain,
  getWorldMapDimensions,
  isWalkableTerrain,
  JS_VILLAGE_EXIT_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  WORLD_MAP_STARTS,
} from './worldMap'

describe('GREENFIELD VILLAGE geography', () => {
  it('11x9 viewportを複数画面ぶん歩ける31x25 local mapにする', () => {
    expect(getWorldMapDimensions(JS_VILLAGE_MAP_ID)).toEqual({ width: 31, height: 25 })
    expect(WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID]).toEqual({ x: 10, y: 21 })
    expect(JS_VILLAGE_EXIT_POSITION).toEqual({ x: 10, y: 24 })
  })

  it('南門から中央へ歩け、旧start位置もlegacy save用にwalkableなまま残す', () => {
    expect(isWalkableTerrain(getTerrain(10, 21, JS_VILLAGE_MAP_ID))).toBe(true)
    expect(isWalkableTerrain(getTerrain(10, 12, JS_VILLAGE_MAP_ID))).toBe(true)
    expect(getTerrain(10, 24, JS_VILLAGE_MAP_ID)).toBe('exit')
  })

  it('東側の川は二つの橋以外を塞ぎ、景色で地区を分ける', () => {
    expect(getTerrain(21, 13, JS_VILLAGE_MAP_ID)).toBe('water')
    expect(getTerrain(21, 7, JS_VILLAGE_MAP_ID)).toBe('road')
    expect(getTerrain(21, 14, JS_VILLAGE_MAP_ID)).toBe('road')
  })

  it('宿・道具屋・装備屋を別地区へ分散し、それぞれ正面の道からActionできる', () => {
    const expected = {
      inn: { target: { x: 5, y: 20 }, approach: { x: 5, y: 21 } },
      'item-shop': { target: { x: 15, y: 11 }, approach: { x: 15, y: 12 } },
      'equipment-shop': { target: { x: 25, y: 6 }, approach: { x: 25, y: 7 } },
    } as const

    for (const facility of VILLAGE_FACILITIES) {
      const placement = expected[facility.kind]
      expect(facility.position).toEqual(placement.target)
      expect(getTerrain(facility.position.x, facility.position.y, JS_VILLAGE_MAP_ID)).toBe('house')
      expect(isWalkableTerrain(getTerrain(placement.approach.x, placement.approach.y, JS_VILLAGE_MAP_ID))).toBe(true)
    }
  })

  it('MIOの訓練場は中央道から枝分かれした北側laneに残す', () => {
    expect(JS_VILLAGE_TRAINING_POSITION).toEqual({ x: 12, y: 7 })
    expect(getTerrain(12, 7, JS_VILLAGE_MAP_ID)).toBe('training')
    expect(isWalkableTerrain(getTerrain(11, 7, JS_VILLAGE_MAP_ID))).toBe(true)
  })
})
