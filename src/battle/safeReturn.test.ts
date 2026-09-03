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
  it('Forest序盤の敗北RETURNはグリーンフィールド村へ戻す', () => {
    const before = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 24, y: 10 },
      currentHp: 42,
      stepsSinceEncounter: 5,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(returned.worldPosition).toEqual(WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID])
    expect(returned.currentHp).toBe(42)
    expect(returned.stepsSinceEncounter).toBe(0)
  })

  it('Forest奥地の敗北RETURNは通過済み野営地の隣へ戻す', () => {
    const before = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 10, y: 10 },
      currentHp: 31,
      stepsSinceEncounter: 7,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(JS_FOREST_MAP_ID)
    expect(returned.worldPosition).toEqual({ x: 20, y: 10 })
    expect(returned.currentHp).toBe(31)
    expect(returned.stepsSinceEncounter).toBe(0)
  })

  it('Deep Forest序盤はForest野営地、奥地は湧き水へ戻す', () => {
    const initial = createInitialRpgState()
    const early = getSafeBattleReturnState({
      ...initial,
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 24, y: 10 },
      currentHp: 38,
    })
    expect(early.worldMapId).toBe(JS_FOREST_MAP_ID)
    expect(early.worldPosition).toEqual({ x: 20, y: 10 })
    expect(early.currentHp).toBe(38)

    const deep = getSafeBattleReturnState({
      ...initial,
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 10, y: 10 },
      currentHp: 27,
    })
    expect(deep.worldMapId).toBe(JS_DEEP_FOREST_MAP_ID)
    expect(deep.worldPosition).toEqual({ x: 16, y: 10 })
    expect(deep.currentHp).toBe(27)
  })

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
