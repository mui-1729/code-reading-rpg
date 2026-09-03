import { describe, expect, it } from 'vitest'
import {
  getTerrain,
  isEncounterTerrain,
  JS_BOSS_POSITION,
  JS_FOREST_POSITION,
  JS_VILLAGE_POSITION,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_GATE_POSITION,
  WORLD_START,
} from './worldMap'

describe('Overworld arrival layout', () => {
  it('到着地点から西のJavaScript側だけを安全なmain trailとしてつなぐ', () => {
    expect(getTerrain(WORLD_START.x, WORLD_START.y, OVERWORLD_MAP_ID)).toBe('town')

    for (let x = JS_FOREST_POSITION.x + 1; x < WORLD_START.x; x += 1) {
      expect(getTerrain(x, WORLD_START.y, OVERWORLD_MAP_ID)).toBe('road')
    }

    expect(getTerrain(JS_FOREST_POSITION.x, WORLD_START.y, OVERWORLD_MAP_ID)).toBe('woods')
    expect(getTerrain(JS_FOREST_POSITION.x - 1, WORLD_START.y, OVERWORLD_MAP_ID)).not.toBe('road')
    expect(isEncounterTerrain(getTerrain(WORLD_START.x - 1, WORLD_START.y, OVERWORLD_MAP_ID))).toBe(false)
  })

  it('Villageへの分岐とCode Core手前だけに縦のroadを残す', () => {
    expect(getTerrain(JS_VILLAGE_POSITION.x, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_VILLAGE_POSITION.x, 13, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_VILLAGE_POSITION.x, JS_VILLAGE_POSITION.y, OVERWORLD_MAP_ID)).toBe('village')

    expect(getTerrain(JS_BOSS_POSITION.x, 6, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, 5, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, 4, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, 7, OVERWORLD_MAP_ID)).not.toBe('road')
  })

  it('東は短い石畳が封鎖門で終わり、その先へgeneric roadを伸ばさない', () => {
    expect(getTerrain(21, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('stone')
    expect(getTerrain(22, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('stone')
    expect(
      getTerrain(TS_FRONTIER_GATE_POSITION.x, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID),
    ).toBe('gate')
    expect(getTerrain(24, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).not.toBe('road')
    expect(isEncounterTerrain('stone')).toBe(false)
  })
})
