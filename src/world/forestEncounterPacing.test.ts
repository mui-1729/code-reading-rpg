import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_FOREST_MAP_ID } from './worldMap'

const FOREST_PROGRESS_THROUGH_BATTLE_10 = {
  ...createInitialPlayerProgress(),
  clearedStageIds: [1, 7, 8, 9, 10],
  unlockedStageIds: [1, 7, 8, 9, 10, 11],
}

describe('Forest random encounter pacing', () => {
  it('ForestはBattle後7歩を安全区間にし、8歩目からRandom復習Battleを抽選する', () => {
    const baseState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 43, y: 20 },
      encounterCount: 4,
    }

    const seventhStep = resolveWorldMove({
      rpgState: { ...baseState, stepsSinceEncounter: 6 },
      progress: FOREST_PROGRESS_THROUGH_BATTLE_10,
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(seventhStep.kind).toBe('moved')
    expect(seventhStep.terrain).toBe('woods')
    expect(seventhStep.nextState.stepsSinceEncounter).toBe(7)
    expect(seventhStep.nextState.encounterCount).toBe(4)

    const eighthStep = resolveWorldMove({
      rpgState: { ...baseState, stepsSinceEncounter: 7 },
      progress: FOREST_PROGRESS_THROUGH_BATTLE_10,
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(eighthStep.kind).toBe('encounter')
    if (eighthStep.kind !== 'encounter') return
    expect(eighthStep.battle.battleId).toBe(10)
    expect(eighthStep.nextState.stepsSinceEncounter).toBe(0)
    expect(eighthStep.nextState.encounterCount).toBe(5)
  })

  it('次のLearning BattleはRandom安全歩数より優先して新しい候補地域へ入った時点で発生する', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition: { x: 41, y: 12 },
        stepsSinceEncounter: 0,
        encounterCount: 2,
        forestLearningBattleZones: { 10: 'east-entry' },
      },
      progress: FOREST_PROGRESS_THROUGH_BATTLE_10,
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(11)
    expect(result.nextState.stepsSinceEncounter).toBe(0)
    expect(result.nextState.forestLearningBattleZones?.[11]).toBe('riverbank')
  })
})
