import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { getDeepForestReviewBattleId, resolveWorldMove } from './worldActions'
import {
  JS_BOSS_POSITION,
  JS_DEEP_FOREST_CORE_EXIT_POSITION,
  JS_DEEP_FOREST_LEARNING_POSITIONS,
  JS_DEEP_FOREST_MAP_ID,
  OVERWORLD_MAP_ID,
  WORLD_MAP_STARTS,
} from './worldMap'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

const throughFilter = [1, 7, 8, 9, 10, 11, 12, 13, 14]
const through15 = [...throughFilter, 2, 15]

function deepForestMove(
  clearedStageIds: number[],
  from: { x: number; y: number },
  dx: number,
  dy: number,
  stepsSinceEncounter = 0,
  trigger = 0.99,
) {
  const progress = createInitialPlayerProgress()
  const rpgState = {
    ...createInitialRpgState(),
    worldMapId: JS_DEEP_FOREST_MAP_ID,
    worldPosition: from,
    stepsSinceEncounter,
  }

  return resolveWorldMove({
    rpgState,
    progress: { ...progress, clearedStageIds },
    dx,
    dy,
    encounterRolls: { trigger, battle: 0.99 },
  })
}

function expectFixedBattle(
  clearedStageIds: number[],
  from: { x: number; y: number },
  move: { dx: number; dy: number },
  expectedBattleId: number,
) {
  const result = deepForestMove(clearedStageIds, from, move.dx, move.dy)
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
    const start = WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID]
    const result = deepForestMove(throughFilter, start, -1, 0)

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(2)
  })

  it('二つ目のincident後は15 → 16 → 17 → 18を上下左右に離れた自然landmarkで固定導入する', () => {
    expectFixedBattle([...throughFilter, 2], { x: 58, y: 31 }, { dx: -1, dy: 0 }, 15)
    expectFixedBattle(through15, { x: 52, y: 18 }, { dx: 0, dy: -1 }, 16)
    expectFixedBattle([...through15, 16], { x: 45, y: 10 }, { dx: 1, dy: 0 }, 17)
    expectFixedBattle([...through15, 16, 17], { x: 37, y: 19 }, { dx: 0, dy: 1 }, 18)
  })

  it('18後はRoot Guardian 19、その後20 → 21 → 22を別方向のlandmarkで追う', () => {
    const through18 = [...through15, 16, 17, 18]
    expectFixedBattle(through18, { x: 31, y: 27 }, { dx: -1, dy: 0 }, 19)
    expectFixedBattle([...through18, 19], { x: 23, y: 34 }, { dx: 0, dy: 1 }, 20)
    expectFixedBattle([...through18, 19, 20], { x: 16, y: 28 }, { dx: -1, dy: 0 }, 21)
    expectFixedBattle([...through18, 19, 20, 21], { x: 8, y: 16 }, { dx: 0, dy: -1 }, 22)
  })

  it('旧x thresholdを跨ぐだけでは次Lessonを開始せず、対応landmarkへ入った時だけ開始する', () => {
    const nearMapLandmark = deepForestMove(through15, { x: 54, y: 17 }, -1, 0)
    expect(nearMapLandmark.kind).toBe('moved')
    expectFixedBattle(through15, { x: 53, y: 17 }, { dx: -1, dy: 0 }, 16)

    const target = JS_DEEP_FOREST_LEARNING_POSITIONS[18]
    const wrongY = deepForestMove([...through15, 16, 17], { x: target.x + 1, y: target.y + 4 }, -1, 0)
    expect(wrongY.kind).toBe('moved')
  })

  it('拡張したDeep Forestは9歩までRandom reviewを抑え、10歩目からだけrollする', () => {
    const cleared = [...through15, 16]
    const safe = deepForestMove(cleared, { x: 55, y: 25 }, -1, 0, 8, 0)
    expect(safe.kind).toBe('moved')

    const rolled = deepForestMove(cleared, { x: 55, y: 25 }, -1, 0, 9, 0)
    expect(rolled.kind).toBe('encounter')
    if (rolled.kind !== 'encounter') return
    expect([14, 15, 16]).toContain(rolled.battle.battleId)
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

  it('Battle 22後はDeep Forest西口で止まり、ActionでCode Core手前へ直接抜ける', () => {
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

    expect(resolveWorldMove({ rpgState, progress, dx: -1, dy: 0 }).kind).toBe('blocked')
    const intent = resolveWorldTargetInteraction(rpgState, progress, JS_DEEP_FOREST_CORE_EXIT_POSITION)

    expect(intent.kind).toBe('map-transition')
    if (intent.kind !== 'map-transition') return
    expect(intent.toMapId).toBe(OVERWORLD_MAP_ID)
    expect(intent.label).toBe('Code Core前')
    expect(intent.nextState.worldPosition.x).toBe(JS_BOSS_POSITION.x)
    expect(intent.nextState.worldPosition.y).toBeGreaterThan(JS_BOSS_POSITION.y)
  })

  it('Final Bossは最初のincident・二つ目のincident・最終traceを含む全route完了後だけunlockする', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: JS_BOSS_POSITION.x, y: JS_BOSS_POSITION.y + 1 },
    }
    const through22 = [...through15, 16, 17, 18, 19, 20, 21, 22]

    const missingSecond = resolveWorldTargetInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22.filter((id) => id !== 2),
    }, JS_BOSS_POSITION)
    expect(missingSecond.kind === 'boss' && missingSecond.unlocked).toBe(false)

    const missingTrace = resolveWorldTargetInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22.filter((id) => id !== 22),
    }, JS_BOSS_POSITION)
    expect(missingTrace.kind === 'boss' && missingTrace.unlocked).toBe(false)

    const ready = resolveWorldTargetInteraction(rpgState, {
      ...progress,
      clearedStageIds: through22,
    }, JS_BOSS_POSITION)
    expect(ready.kind).toBe('boss')
    if (ready.kind !== 'boss') return
    expect(ready.battleId).toBe(3)
    expect(ready.unlocked).toBe(true)
  })
})
