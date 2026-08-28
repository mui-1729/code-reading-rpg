import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import {
  getEncounterBattleId,
  getTerrain,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_DEEP_FOREST_POSITION,
  JS_FOREST_MAP_ID,
  WORLD_MAP_STARTS,
} from './worldMap'

const clearedThrough14 = [7, 8, 9, 10, 11, 12, 13, 14]

describe('JavaScript Deep Forest', () => {
  it('Battle 14 clear前はForest西端のDeep Forest入口を通れない', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: JS_FOREST_DEEP_FOREST_POSITION.x + 1, y: JS_FOREST_DEEP_FOREST_POSITION.y },
    }

    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: [7, 8, 9, 10, 11, 12, 13] },
      dx: -1,
      dy: 0,
    })

    expect(getTerrain(JS_FOREST_DEEP_FOREST_POSITION.x, JS_FOREST_DEEP_FOREST_POSITION.y, JS_FOREST_MAP_ID)).toBe('exit')
    expect(result.kind).toBe('blocked')
  })

  it('Battle 14 clear後はForestからDeep Forestへtransitionする', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 2, y: 10 },
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

  it('Deep Forest最初のEncounter terrainではBattle 15を固定導入する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID] },
      stepsSinceEncounter: 0,
    }

    const result = resolveWorldMove({
      rpgState,
      progress: {
        ...progress,
        clearedStageIds: clearedThrough14,
        unlockedStageIds: [...progress.unlockedStageIds, 15],
      },
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(15)
  })

  it('Battle 15 clear前はRandomが14だけ、clear後は14 / 15を反復する', () => {
    const unlocked = [14, 15]

    expect(getEncounterBattleId('javascript', unlocked, clearedThrough14, 0.99, JS_DEEP_FOREST_MAP_ID)).toBe(14)

    const cleared15 = [...clearedThrough14, 15]
    expect(getEncounterBattleId('javascript', unlocked, cleared15, 0.1, JS_DEEP_FOREST_MAP_ID)).toBe(14)
    expect(getEncounterBattleId('javascript', unlocked, cleared15, 0.9, JS_DEEP_FOREST_MAP_ID)).toBe(15)
  })
})
