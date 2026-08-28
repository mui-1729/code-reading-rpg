import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID } from './worldMap'

function progressWith(clearedStageIds: number[]) {
  const progress = createInitialPlayerProgress()
  return {
    ...progress,
    clearedStageIds,
    unlockedStageIds: [...progress.unlockedStageIds, 10, 11, 12, 13, 14, 15],
    unlockedSkillIds: [...progress.unlockedSkillIds, 'link', 'fork', 'gather'],
  }
}

describe('JavaScript Deep Forest filter route', () => {
  it('Battle 14未clearではForest西端からDeep Forestへ入れない', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition: { x: 2, y: 10 },
        stepsSinceEncounter: 8,
      },
      progress: progressWith([7, 8, 9, 10, 11, 12, 13]),
      dx: -1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
  })

  it('Battle 14 clear後はForest西端からDeep Forestへtransitionする', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition: { x: 2, y: 10 },
        stepsSinceEncounter: 8,
      },
      progress: progressWith([7, 8, 9, 10, 11, 12, 13, 14]),
      dx: -1,
      dy: 0,
    })

    expect(result.kind).toBe('transition')
    if (result.kind !== 'transition') throw new Error('expected Deep Forest transition')
    expect(result.toMapId).toBe(JS_DEEP_FOREST_MAP_ID)
    expect(result.nextState.worldPosition).toEqual({ x: 24, y: 9 })
  })

  it('Deep Forest最初のEncounter terrainでBattle 15を固定導入する', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_DEEP_FOREST_MAP_ID,
        worldPosition: { x: 24, y: 9 },
        stepsSinceEncounter: 8,
      },
      progress: progressWith([7, 8, 9, 10, 11, 12, 13, 14]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 1, battle: 0.01 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') throw new Error('expected fixed Deep Forest lesson')
    expect(result.battle.battleId).toBe(15)
    expect(result.battle.seed).toContain('js-deep-forest')
  })

  it('Battle 15 clear後は固定導入を繰り返さない', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_DEEP_FOREST_MAP_ID,
        worldPosition: { x: 24, y: 9 },
        stepsSinceEncounter: 8,
      },
      progress: progressWith([7, 8, 9, 10, 11, 12, 13, 14, 15]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 1, battle: 0.99 },
    })

    expect(result.kind).toBe('moved')
  })
})
