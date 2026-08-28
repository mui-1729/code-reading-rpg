import { describe, expect, it } from 'vitest'
import {
  getTerrain,
  getWorldMapDimensions,
  getWorldMapLabel,
  getWorldPortalAtPosition,
  getWorldRegion,
  isWorldPositionInBounds,
  JS_DEEP_FOREST_EXIT_POSITION,
  JS_DEEP_FOREST_MAP_ID,
  JS_DEEP_FOREST_POSITION,
  JS_FOREST_MAP_ID,
} from './worldMap'

describe('JavaScript Deep Forest map', () => {
  it('stable map ID / bounds / labelを持つ', () => {
    expect(getWorldMapDimensions(JS_DEEP_FOREST_MAP_ID)).toEqual({ width: 27, height: 19 })
    expect(getWorldMapLabel(JS_DEEP_FOREST_MAP_ID)).toBe('JAVASCRIPT DEEP FOREST')
    expect(getWorldRegion(24, JS_DEEP_FOREST_MAP_ID)).toBe('javascript')
    expect(isWorldPositionInBounds(JS_DEEP_FOREST_MAP_ID, { x: 24, y: 9 })).toBe(true)
    expect(isWorldPositionInBounds(JS_DEEP_FOREST_MAP_ID, { x: 27, y: 9 })).toBe(false)
  })

  it('Forest西端と往復できるportalを持つ', () => {
    expect(getWorldPortalAtPosition(JS_FOREST_MAP_ID, JS_DEEP_FOREST_POSITION)).toMatchObject({
      fromMapId: JS_FOREST_MAP_ID,
      toMapId: JS_DEEP_FOREST_MAP_ID,
      targetPosition: { x: 24, y: 9 },
      requiredClearedStageId: 14,
    })

    expect(
      getWorldPortalAtPosition(JS_DEEP_FOREST_MAP_ID, JS_DEEP_FOREST_EXIT_POSITION),
    ).toMatchObject({
      fromMapId: JS_DEEP_FOREST_MAP_ID,
      toMapId: JS_FOREST_MAP_ID,
      targetPosition: { x: 2, y: 10 },
    })
  })

  it('入口trailとDeep Woods encounter terrainを持つ', () => {
    expect(getTerrain(24, 9, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(['woods', 'deep-woods']).toContain(getTerrain(24, 8, JS_DEEP_FOREST_MAP_ID))
    expect(getTerrain(13, 8, JS_DEEP_FOREST_MAP_ID)).toBe('water')
    expect(getTerrain(26, 9, JS_DEEP_FOREST_MAP_ID)).toBe('exit')
  })
})
