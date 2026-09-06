import { describe, expect, it } from 'vitest'
import { createInitialRpgState } from '../rpg'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  WORLD_MAP_STARTS,
} from '../world/worldMap'
import { registerWorldCheckpoint } from '../world/worldCheckpoints'
import { getSafeBattleReturnState } from './safeReturn'

describe('getSafeBattleReturnState', () => {
  it('current Forest x座標ではなく保存済みGREENFIELD checkpointへ戻す', () => {
    const initial = registerWorldCheckpoint(createInitialRpgState(), 'greenfield-village')

    for (const worldPosition of [{ x: 24, y: 10 }, { x: 10, y: 10 }]) {
      const before = {
        ...initial,
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition,
        currentHp: 42,
        stepsSinceEncounter: 5,
      }
      const returned = getSafeBattleReturnState(before)

      expect(returned.worldMapId).toBe(JS_VILLAGE_MAP_ID)
      expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID])
      expect(returned.safeCheckpoint.id).toBe('greenfield-village')
      expect(returned.currentHp).toBe(42)
      expect(returned.stepsSinceEncounter).toBe(0)
    }
  })

  it('Deep Forestでもcamp / spring位置を推測せず最後の有人safe hubへ戻す', () => {
    const before = {
      ...registerWorldCheckpoint(createInitialRpgState(), 'greenfield-village'),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 10, y: 10 },
      currentHp: 27,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID])
    expect(returned.currentHp).toBe(27)
  })

  it('GREENFIELD未到達なら中央Hub checkpointへ戻す', () => {
    const before = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 10, y: 10 },
      currentHp: 35,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[OVERWORLD_MAP_ID])
    expect(returned.safeCheckpoint.id).toBe('central-hub')
    expect(returned.currentHp).toBe(35)
  })
})
