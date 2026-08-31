import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import {
  getDeepForestReviewBattleId,
  resolveWorldInteraction,
  resolveWorldMove,
} from './worldActions'
import {
  JS_BOSS_POSITION,
  JS_DEEP_FOREST_CORE_EXIT_POSITION,
  JS_DEEP_FOREST_MAP_ID,
  OVERWORLD_MAP_ID,
} from './worldMap'

const throughFilter = [1, 7, 8, 9, 10, 11, 12, 13, 14]
const through15 = [...throughFilter, 2, 15]

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
    progress: { ...progress, clearedStageIds },
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
  const result = deepForestMove(clearedStageIds, from, -1, 0)
  expect(result.kind).toBe('encounter')
  if (result.kind !== 'encounter') return
  expect(result.battle.battleId).toBe(expectedBattleId)
}

describe('JavaScript incident-driven final world route', () => {
  it('BYTE合流後はTraining前のOverworldで最初の実incidentを固定再現する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      partyMemberIds: ['byte'],
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: 14, y: 13 },
    }

    const result = resolveWorldMove({
      rpgState,
      progress,
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(1)
  })

  it('BYTE未加入なら同じ草原へ入ってもfirst incidentを開始しない', () => {
    const result = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: OVERWORLD_MAP_ID,
        worldPosition: { x: 14, y: 13 },
      },
      progress: createInitialPlayerProgress(),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('moved')
  })

  it('Forest filter trace後はDeep Forest最初の移動で二つ目の実incidentを固定再現する', () => {
    const result = deepForestMove(throughFilter, { x: 28, y: 10 }, -1, 0)

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(2)
  })

  it('二つ目のincident後は東から西へ15 → 16 → 17 → 18を固定導入する', () => {
    expectFixedBattle([...throughFilter, 2], { x: 27, y: 9 }, 15)
    expectFixedBattle(through15, { x: 24, y: 8 }, 16)
    expectFixedBattle([...through15, 16], { x: 20, y: 9 }, 17)
    expectFixedBattle([...through15, 16, 17], { x: 15, y: 9 }, 18)
  })

  it('18後はRoot Guardian 19、その後20 → 21 → 22を最深部で順番に追う', () => {
    const through18 = [...through15, 16, 17, 18]
    expectFixedBattle(through18, { x: 11, y: 9 }, 19)
    expectFixedBattle([...through18, 19], { x: 10, y: 9 }, 20)
    expectFixedBattle([...through18, 19, 20], { x: 8, y: 9 }, 21)
    expectFixedBattle([...through18, 19, 20, 21], { x: 6, y: 9 }, 22)
  })

  it('Deep Forest Randomはclear済みLessonだけを返しstory Battle 2 / Guardian 19を混ぜない', () => {
    const through18 = [...through15, 16, 17, 18]
    const seen = new Set<number>()

    for (const roll of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.99]) {
      const battleId = getDeepForestReviewBattleId(through18, roll)
      if (battleId !== null) seen.add(battleId)
    }

    expect([...seen].every((id) => through18.includes(id))).toBe(true)
    expect(seen.has(2)).toBe(false)
    expect(seen.has(19)).toBe(false)
    expect(seen.has(20)).toBe(false)
  })

  it('Battle 22後はDeep Forest西口からCode Core手前へ直接抜ける', () => {
    const through22 = [...through15, 16, 17, 18, 19, 20, 21, 22]
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: JS_DEEP_FOREST_CORE_EXIT_POSITION.x + 1, y: JS_DEEP_FOREST_CORE_EXIT_POSITION.y },
    }
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: through22,
    }

    const result = resolveWorldMove({ rpgState, progress, dx: -1, dy: 0 })

    expect(result.kind).toBe('transition')
    if (result.kind !== 'transition') return
    expect(result.toMapId).toBe(OVERWORLD_MAP_ID)
    expect(result.label).toBe('CODE CORE APPROACH')
    expect(result.nextState.worldPosition.x).toBe(JS_BOSS_POSITION.x)
    expect(result.nextState.worldPosition.y).toBeGreaterThan(JS_BOSS_POSITION.y)
  })

  it('Final Bossは最初のincident・二つ目のincident・最終traceを含む全route完了後だけunlockする', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: JS_BOSS_POSITION.x, y: JS_BOSS_POSITION.y + 1 },
    }
    const through22 = [...through15, 16, 17, 18, 19, 20, 21, 22]

    const missingSecond = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22.filter((id) => id !== 2),
    })
    expect(missingSecond.kind === 'boss' && missingSecond.unlocked).toBe(false)

    const missingTrace = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22.filter((id) => id !== 22),
    })
    expect(missingTrace.kind === 'boss' && missingTrace.unlocked).toBe(false)

    const ready = resolveWorldInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22,
    })
    expect(ready.kind).toBe('boss')
    if (ready.kind !== 'boss') return
    expect(ready.battleId).toBe(3)
    expect(ready.unlocked).toBe(true)
  })
})
