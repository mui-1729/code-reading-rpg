import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import {
  getDeepForestReviewBattleId,
  resolveWorldInteraction,
  resolveWorldMove,
} from './worldActions'
import {
  getTerrain,
  JS_BOSS_POSITION,
  JS_DEEP_FOREST_MAP_ID,
  OVERWORLD_MAP_ID,
} from './worldMap'

const clearedThrough15 = [7, 8, 9, 10, 11, 12, 13, 14, 15]

function deepForestMove(
  clearedStageIds: number[],
  from: { x: number; y: number },
  dx: number,
  dy: number,
) {
  const progress = createInitialPlayerProgress()
  const rpgState = {
    ...createInitialRpgState(),
    worldMapId: JS_DEEP_FOREST_MAP_ID,
    worldPosition: from,
    stepsSinceEncounter: 0,
  }

  return resolveWorldMove({
    rpgState,
    progress: {
      ...progress,
      clearedStageIds,
      unlockedStageIds: [...progress.unlockedStageIds, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    },
    dx,
    dy,
    encounterRolls: { trigger: 0.99, battle: 0.99 },
  })
}

function expectFixedBattle(
  clearedStageIds: number[],
  from: { x: number; y: number },
  expectedBattleId: number,
) {
  const next = { x: from.x - 1, y: from.y }
  expect(['woods', 'deep-woods']).toContain(getTerrain(next.x, next.y, JS_DEEP_FOREST_MAP_ID))

  const result = deepForestMove(clearedStageIds, from, -1, 0)
  expect(result.kind).toBe('encounter')
  if (result.kind !== 'encounter') return
  expect(result.battle.battleId).toBe(expectedBattleId)
}

describe('JavaScript Deep Forest final world route', () => {
  it('Battle 15後は東から西へ16 → 17 → 18を固定導入する', () => {
    expectFixedBattle(clearedThrough15, { x: 24, y: 8 }, 16)
    expectFixedBattle([...clearedThrough15, 16], { x: 20, y: 9 }, 17)
    expectFixedBattle([...clearedThrough15, 16, 17], { x: 15, y: 9 }, 18)
  })

  it('Battle 18後は第二MID BOSS 19を固定し、その後20 → 21 → 22を最深部で順番に導入する', () => {
    const through18 = [...clearedThrough15, 16, 17, 18]
    expectFixedBattle(through18, { x: 11, y: 9 }, 19)
    expectFixedBattle([...through18, 19], { x: 10, y: 9 }, 20)
    expectFixedBattle([...through18, 19, 20], { x: 8, y: 9 }, 21)
    expectFixedBattle([...through18, 19, 20, 21], { x: 6, y: 9 }, 22)
  })

  it('Deep Forest Randomはclear済みLessonだけを返し、MID BOSS 19は混ぜない', () => {
    const through18 = [...clearedThrough15, 16, 17, 18]
    const seen = new Set<number>()

    for (const roll of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.99]) {
      const battleId = getDeepForestReviewBattleId(through18, roll)
      if (battleId !== null) seen.add(battleId)
    }

    expect([...seen].every((id) => through18.includes(id))).toBe(true)
    expect(seen.has(19)).toBe(false)
    expect(seen.has(20)).toBe(false)
  })

  it('Battle 22前はOverworld JavaScript Randomで旧Battle 1 / 2を先出ししない', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: 9, y: 18 },
      stepsSinceEncounter: 8,
    }

    expect(getTerrain(10, 18, OVERWORLD_MAP_ID)).toBe('tall-grass')

    const result = resolveWorldMove({
      rpgState,
      progress: { ...progress, clearedStageIds: [...clearedThrough15, 16, 17, 18, 19, 20, 21] },
      dx: 1,
      dy: 0,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('moved')
  })

  it('Battle 22後はOverworld JavaScript Randomで既存Battle 1から最終異変を再開する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: 9, y: 18 },
      stepsSinceEncounter: 8,
    }

    const result = resolveWorldMove({
      rpgState,
      progress: {
        ...progress,
        clearedStageIds: [...clearedThrough15, 16, 17, 18, 19, 20, 21, 22],
      },
      dx: 1,
      dy: 0,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(1)
  })

  it('JavaScript Final Boss 3はBattle 22 + Battle 1 + Battle 2完了後だけunlockする', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: JS_BOSS_POSITION.x, y: JS_BOSS_POSITION.y + 1 },
    }
    const through22 = [...clearedThrough15, 16, 17, 18, 19, 20, 21, 22]

    const beforeIncident = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22,
    })
    expect(beforeIncident.kind).toBe('boss')
    if (beforeIncident.kind !== 'boss') return
    expect(beforeIncident.unlocked).toBe(false)

    const afterFirst = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: [...through22, 1],
    })
    expect(afterFirst.kind === 'boss' && afterFirst.unlocked).toBe(false)

    const ready = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: [...through22, 1, 2],
    })
    expect(ready.kind).toBe('boss')
    if (ready.kind !== 'boss') return
    expect(ready.battleId).toBe(3)
    expect(ready.unlocked).toBe(true)
  })
})
