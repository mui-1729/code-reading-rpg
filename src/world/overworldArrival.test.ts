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
  it('到着地点周辺は安全なHubとして維持し、Village方面へ曲がる街道につなぐ', () => {
    expect(getTerrain(WORLD_START.x, WORLD_START.y, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(19, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(12, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(12, 18, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(12, 22, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_VILLAGE_POSITION.x, JS_VILLAGE_POSITION.y, OVERWORLD_MAP_ID)).toBe('village')
    expect(isEncounterTerrain(getTerrain(19, 14, OVERWORLD_MAP_ID))).toBe(false)
  })

  it('VillageからForestへは川と橋を越え、main route自体が複数回方向転換する', () => {
    expect(getTerrain(18, 22, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(25, 22, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(25, 24, OVERWORLD_MAP_ID)).toBe('water')
    expect(getTerrain(28, 24, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(28, 31, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(31, 31, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_FOREST_POSITION.x, 33, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_FOREST_POSITION.x, JS_FOREST_POSITION.y, OVERWORLD_MAP_ID)).toBe('woods')
  })

  it('TypeScript境界はHub直横ではなく東の長距離Fieldの先でstone domainへ切り替わる', () => {
    expect(getTerrain(40, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(51, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(52, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('stone')
    expect(getTerrain(61, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID)).toBe('stone')
    expect(
      getTerrain(TS_FRONTIER_GATE_POSITION.x, TS_FRONTIER_GATE_POSITION.y, OVERWORLD_MAP_ID),
    ).toBe('gate')
    expect(isEncounterTerrain('stone')).toBe(false)
  })

  it('Code Core approachはField北側の独立した縦routeとして残す', () => {
    expect(getTerrain(JS_BOSS_POSITION.x, 10, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, 8, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, 6, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(JS_BOSS_POSITION.x, JS_BOSS_POSITION.y, OVERWORLD_MAP_ID)).toBe('boss')
  })
})
