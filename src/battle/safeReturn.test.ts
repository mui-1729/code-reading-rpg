import { describe, expect, it } from 'vitest'
import { createInitialRpgState } from '../rpg'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_MAP_STARTS,
} from '../world/worldMap'
import { getSafeBattleReturnState } from './safeReturn'

describe('getSafeBattleReturnState', () => {
  it.each([JS_FOREST_MAP_ID, JS_DEEP_FOREST_MAP_ID])(
    '%sの敗北RETURNはグリーンフィールド村へ戻す',
    (mapId) => {
      const before = {
        ...createInitialRpgState(),
        worldMapId: mapId,
        worldPosition: { x: 10, y: 10 },
        currentHp: 42,
        stepsSinceEncounter: 5,
      }
      const returned = getSafeBattleReturnState(before)

      expect(returned.worldMapId).toBe(JS_VILLAGE_MAP_ID)
      expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID])
      expect(returned.currentHp).toBe(42)
      expect(returned.stepsSinceEncounter).toBe(0)
    },
  )

  it('TypeScript辺境の敗北RETURNは中央Hubへ戻す', () => {
    const before = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 20, y: 10 },
      currentHp: 35,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[OVERWORLD_MAP_ID])
    expect(returned.currentHp).toBe(35)
  })
})
