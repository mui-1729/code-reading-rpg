import { describe, expect, it } from 'vitest'
import {
  getWorldFacing,
  getWorldScenePresentation,
  isAdjacentWorldStep,
} from './worldPresentation'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
} from './worldMap'

describe('world presentation', () => {
  it.each([
    [{ x: 4, y: 4 }, { x: 5, y: 4 }, 'right'],
    [{ x: 4, y: 4 }, { x: 3, y: 4 }, 'left'],
    [{ x: 4, y: 4 }, { x: 4, y: 3 }, 'up'],
    [{ x: 4, y: 4 }, { x: 4, y: 5 }, 'down'],
  ] as const)('movement %o -> %o resolves facing %s', (from, to, facing) => {
    expect(getWorldFacing(from, to)).toBe(facing)
    expect(isAdjacentWorldStep(from, to)).toBe(true)
  })

  it('map teleport is not treated as a walking step', () => {
    expect(isAdjacentWorldStep({ x: 28, y: 10 }, { x: 20, y: 14 })).toBe(false)
  })

  it('each explorable map has its own scene title and field BGM identity', () => {
    const presentations = [
      getWorldScenePresentation(OVERWORLD_MAP_ID),
      getWorldScenePresentation(JS_VILLAGE_MAP_ID),
      getWorldScenePresentation(JS_FOREST_MAP_ID),
      getWorldScenePresentation(JS_DEEP_FOREST_MAP_ID),
      getWorldScenePresentation(TS_FRONTIER_MAP_ID),
    ]

    expect(new Set(presentations.map(({ sceneId }) => sceneId)).size).toBe(5)
    expect(new Set(presentations.map(({ bgmTrack }) => bgmTrack)).size).toBe(5)
    expect(getWorldScenePresentation(JS_VILLAGE_MAP_ID).title).toBe('グリーンフィールド村')
    expect(getWorldScenePresentation(TS_FRONTIER_MAP_ID).bgmTrack).toBe('fieldTypeScript')
  })
})
