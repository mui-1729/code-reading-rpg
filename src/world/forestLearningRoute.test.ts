import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_FOREST_MAP_ID } from './worldMap'

function forestProgress(clearedStageIds: number[]) {
  const initial = createInitialPlayerProgress()
  return {
    ...initial,
    clearedStageIds,
    unlockedStageIds: [...initial.unlockedStageIds, 1, 7, 8, 9, 10, 11, 12, 13, 14],
  }
}

function forestState(position: { x: number; y: number }) {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: position,
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

describe('JavaScript Forest adaptive learning route', () => {
  it('同じBattle 10でも最初に入った候補地域によって発生場所が変わる', () => {
    const directWest = resolveWorldMove({
      rpgState: forestState({ x: 48, y: 20 }),
      progress: forestProgress([1, 7, 8, 9]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(directWest.kind).toBe('encounter')
    if (directWest.kind !== 'encounter') return
    expect(directWest.battle.battleId).toBe(10)
    expect(directWest.nextState.forestLearningBattleZones?.[10]).toBe('east-entry')
    expect(directWest.nextState.worldPosition).toEqual({ x: 47, y: 20 })

    const northernExplorer = resolveWorldMove({
      rpgState: forestState({ x: 45, y: 6 }),
      progress: forestProgress([1, 7, 8, 9]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(northernExplorer.kind).toBe('encounter')
    if (northernExplorer.kind !== 'encounter') return
    expect(northernExplorer.battle.battleId).toBe(10)
    expect(northernExplorer.nextState.forestLearningBattleZones?.[10]).toBe('east-north')
    expect(northernExplorer.nextState.worldPosition).toEqual({ x: 44, y: 6 })
  })

  it('次のLessonは前のLessonと同じ地域では発生せず、別地域へ来た順に10→11→12と割り当てる', () => {
    const after10 = {
      ...forestState({ x: 48, y: 20 }),
      forestLearningBattleZones: { 10: 'east-entry' as const },
    }

    const sameZone = resolveWorldMove({
      rpgState: after10,
      progress: forestProgress([1, 7, 8, 9, 10]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(sameZone.kind).toBe('moved')

    const battle11 = resolveWorldMove({
      rpgState: {
        ...after10,
        worldPosition: { x: 41, y: 12 },
      },
      progress: forestProgress([1, 7, 8, 9, 10]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(battle11.kind).toBe('encounter')
    if (battle11.kind !== 'encounter') return
    expect(battle11.battle.battleId).toBe(11)
    expect(battle11.nextState.forestLearningBattleZones).toEqual({
      10: 'east-entry',
      11: 'riverbank',
    })

    const battle12 = resolveWorldMove({
      rpgState: {
        ...battle11.nextState,
        worldPosition: { x: 29, y: 25 },
        stepsSinceEncounter: 8,
      },
      progress: forestProgress([1, 7, 8, 9, 10, 11]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(battle12.kind).toBe('encounter')
    if (battle12.kind !== 'encounter') return
    expect(battle12.battle.battleId).toBe(12)
    expect(battle12.nextState.forestLearningBattleZones).toEqual({
      10: 'east-entry',
      11: 'riverbank',
      12: 'center-south',
    })
  })

  it('敗北などで未clearのLessonは保存済み地域に固定され、別地域へ移動しない', () => {
    const assigned = {
      ...forestState({ x: 48, y: 20 }),
      forestLearningBattleZones: { 10: 'east-north' as const },
    }

    const otherZone = resolveWorldMove({
      rpgState: assigned,
      progress: forestProgress([1, 7, 8, 9]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(otherZone.kind).toBe('moved')

    const retryAssignedZone = resolveWorldMove({
      rpgState: {
        ...assigned,
        worldPosition: { x: 45, y: 6 },
      },
      progress: forestProgress([1, 7, 8, 9]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })
    expect(retryAssignedZone.kind).toBe('encounter')
    if (retryAssignedZone.kind !== 'encounter') return
    expect(retryAssignedZone.battle.battleId).toBe(10)
    expect(retryAssignedZone.nextState.forestLearningBattleZones?.[10]).toBe('east-north')
  })
})
