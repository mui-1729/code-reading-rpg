import { describe, expect, it } from 'vitest'
import { createInitialRpgState } from '../rpg'
import { JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID, JS_VILLAGE_MAP_ID } from '../world/worldMap'
import { WORLD_CHECKPOINTS } from '../world/checkpoints'
import { getSafeBattleReturnState } from './safeReturn'

describe('getSafeBattleReturnState', () => {
  it('危険mapやx座標ではなく保存されたGREENFIELD checkpointへ戻す', () => {
    const before = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 4, y: 10 },
      worldCheckpoint: WORLD_CHECKPOINTS.greenfield,
      currentHp: 27,
      stepsSinceEncounter: 7,
    }
    const returned = getSafeBattleReturnState(before)

    expect(returned.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(returned.worldPosition).toEqual(WORLD_CHECKPOINTS.greenfield.position)
    expect(returned.worldCheckpoint).toEqual(WORLD_CHECKPOINTS.greenfield)
    expect(returned.currentHp).toBe(27)
    expect(returned.stepsSinceEncounter).toBe(0)
  })

  it('同じForest座標でもcheckpointが違えば保存された拠点をauthorityにする', () => {
    const initial = createInitialRpgState()
    const dangerousPosition = { x: 10, y: 10 }

    const arrivalReturn = getSafeBattleReturnState({
      ...initial,
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: dangerousPosition,
      currentHp: 42,
    })
    expect(arrivalReturn.worldMapId).toBe(WORLD_CHECKPOINTS.arrival.mapId)
    expect(arrivalReturn.worldPosition).toEqual(WORLD_CHECKPOINTS.arrival.position)

    const villageReturn = getSafeBattleReturnState({
      ...initial,
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: dangerousPosition,
      worldCheckpoint: WORLD_CHECKPOINTS.greenfield,
      currentHp: 42,
    })
    expect(villageReturn.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(villageReturn.worldPosition).toEqual(WORLD_CHECKPOINTS.greenfield.position)
  })

  it('Defeat RETURNはcheckpointへ退避してもHPを無料回復しない', () => {
    const returned = getSafeBattleReturnState({
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 24, y: 10 },
      worldCheckpoint: WORLD_CHECKPOINTS.greenfield,
      currentHp: 1,
      stepsSinceEncounter: 9,
    })

    expect(returned.currentHp).toBe(1)
    expect(returned.stepsSinceEncounter).toBe(0)
  })
})
