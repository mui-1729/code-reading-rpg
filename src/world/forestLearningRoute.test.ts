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
    unlockedStageIds: [...initial.unlockedStageIds, 8, 9, 10, 11, 12],
  }
}

function forestState(x: number) {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: { x, y: 10 },
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

describe('JavaScript Forest learning route', () => {
  it('Battle 10は最初にWoodsへ入った時点でRandom抽選なしに固定導入する', () => {
    const result = resolveWorldMove({
      rpgState: forestState(23),
      progress: forestProgress([7, 8, 9]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
    expect(result.nextState.worldPosition).toEqual({ x: 23, y: 9 })
  })

  it('Battle 10 clear後、Forest東側のRandom Encounterは10だけを反復する', () => {
    const result = resolveWorldMove({
      rpgState: forestState(23),
      progress: forestProgress([7, 8, 9, 10]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
  })

  it('Forest中盤へ進むとBattle 11を固定導入し、その後のRandomは10 / 11だけになる', () => {
    const lesson = resolveWorldMove({
      rpgState: forestState(17),
      progress: forestProgress([7, 8, 9, 10]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(11)

    const replay = resolveWorldMove({
      rpgState: forestState(12),
      progress: forestProgress([7, 8, 9, 10, 11]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(11)
  })

  it('Forest最深側へ進むとBattle 12を固定導入し、clear後に10 / 11 / 12を反復する', () => {
    const lesson = resolveWorldMove({
      rpgState: forestState(8),
      progress: forestProgress([7, 8, 9, 10, 11]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(12)

    const replay = resolveWorldMove({
      rpgState: forestState(12),
      progress: forestProgress([7, 8, 9, 10, 11, 12]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(12)
  })
})
