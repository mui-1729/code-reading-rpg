import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_FOREST_LEARNING_POSITIONS, JS_FOREST_MAP_ID } from './worldMap'

function forestProgress(clearedStageIds: number[]) {
  const initial = createInitialPlayerProgress()
  return {
    ...initial,
    clearedStageIds,
    unlockedStageIds: [...initial.unlockedStageIds, 1, 8, 9, 10, 11, 12],
  }
}

function beforeTarget(target: { x: number; y: number }) {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: { x: target.x + 1, y: target.y },
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

function enterTarget(
  battleId: keyof typeof JS_FOREST_LEARNING_POSITIONS,
  clearedStageIds: number[],
  encounterRolls = { trigger: 0.99, battle: 0.99 },
) {
  const target = JS_FOREST_LEARNING_POSITIONS[battleId]
  return resolveWorldMove({
    rpgState: beforeTarget(target),
    progress: forestProgress(clearedStageIds),
    dx: -1,
    dy: 0,
    encounterRolls,
  })
}

describe('JavaScript Forest learning route', () => {
  it('最初のincident後、折れ枝のtrace地点でBattle 10を固定導入する', () => {
    const result = enterTarget(10, [7, 8, 9, 1])

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
    expect(result.nextState.worldPosition).toEqual(JS_FOREST_LEARNING_POSITIONS[10])
  })

  it('Battle 10 clear後、同じForestのEncounter terrainでは10だけを反復する', () => {
    const result = enterTarget(10, [7, 8, 9, 1, 10], { trigger: 0, battle: 0.99 })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
  })

  it('川辺の足跡へ進むとBattle 11を固定導入し、その後のRandomは10 / 11だけになる', () => {
    const lesson = enterTarget(11, [7, 8, 9, 1, 10])

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(11)
    expect(lesson.nextState.worldPosition).toEqual(JS_FOREST_LEARNING_POSITIONS[11])

    const replay = enterTarget(11, [7, 8, 9, 1, 10, 11], { trigger: 0, battle: 0.99 })
    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(11)
  })

  it('踏み荒らされた草の足跡へ進むとBattle 12を固定導入し、clear後に10 / 11 / 12を反復する', () => {
    const lesson = enterTarget(12, [7, 8, 9, 1, 10, 11])

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(12)
    expect(lesson.nextState.worldPosition).toEqual(JS_FOREST_LEARNING_POSITIONS[12])

    const replay = enterTarget(12, [7, 8, 9, 1, 10, 11, 12], { trigger: 0, battle: 0.99 })
    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(12)
  })
})
