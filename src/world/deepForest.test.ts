import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { getDeepForestReviewBattleId, resolveWorldMove } from './worldActions'
import {
  getTerrain,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_DEEP_FOREST_POSITION,
  JS_FOREST_MAP_ID,
  WORLD_MAP_STARTS,
} from './worldMap'

const clearedThrough14 = [7, 8, 9, 1, 10, 11, 12, 13, 14]

describe('JavaScript Deep Forest', () => {
  it('filter trace clear前はForest西端のDeep Forest入口を通れない', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: JS_FOREST_DEEP_FOREST_POSITION.x + 1, y: JS_FOREST_DEEP_FOREST_POSITION.y },
    }

    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: [7, 8, 9, 1, 10, 11, 12, 13] },
      dx: -1,
      dy: 0,
    })

    expect(getTerrain(JS_FOREST_DEEP_FOREST_POSITION.x, JS_FOREST_DEEP_FOREST_POSITION.y, JS_FOREST_MAP_ID)).toBe('exit')
    expect(result.kind).toBe('blocked')
  })

  it('filter trace clear後はForestからDeep Forestへtransitionする', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: JS_FOREST_DEEP_FOREST_POSITION.x + 1, y: JS_FOREST_DEEP_FOREST_POSITION.y },
    }

    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: clearedThrough14 },
      dx: -1,
      dy: 0,
    })

    expect(result.kind).toBe('transition')
    if (result.kind !== 'transition') return
    expect(result.toMapId).toBe(JS_DEEP_FOREST_MAP_ID)
    expect(result.nextState.worldMapId).toBe(JS_DEEP_FOREST_MAP_ID)
    expect(result.nextState.worldPosition).toEqual(WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID])
  })

  it('Deep Forest最初の移動では二つ目の実incidentを固定再現する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID] },
      stepsSinceEncounter: 0,
    }

    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: clearedThrough14 },
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(2)
  })

  it('二つ目のincident後、最初のEncounter terrainではshared trace Battle 15を固定導入する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 40, y: 18 },
      stepsSinceEncounter: 0,
    }

    expect(getTerrain(40, 17, JS_DEEP_FOREST_MAP_ID)).toMatch(/woods/)
    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: [...clearedThrough14, 2] },
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(15)
  })

  it('Battle 15 clear前はRandomが14だけ、clear後は14 / 15を反復する', () => {
    const afterSecondIncident = [...clearedThrough14, 2]
    expect(getDeepForestReviewBattleId(afterSecondIncident, 0.99)).toBe(14)

    const cleared15 = [...afterSecondIncident, 15]
    expect(getDeepForestReviewBattleId(cleared15, 0.1)).toBe(14)
    expect(getDeepForestReviewBattleId(cleared15, 0.9)).toBe(15)
  })
})
