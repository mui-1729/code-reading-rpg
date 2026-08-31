import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_FOREST_MAP_ID } from './worldMap'

function forestState() {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: { x: 4, y: 10 },
    stepsSinceEncounter: 8,
  }
}

function forestProgress(clearedStageIds: number[]) {
  const progress = createInitialPlayerProgress()
  return {
    ...progress,
    clearedStageIds,
    unlockedStageIds: [...progress.unlockedStageIds, 1, 10, 11, 12, 13, 14],
    unlockedSkillIds: [...progress.unlockedSkillIds, 'link', 'fork'],
  }
}

describe('JavaScript Forest filter trace trigger', () => {
  it('Guardian未clearでは西側Woodsへ入ってもfilter traceを固定導入しない', () => {
    const result = resolveWorldMove({
      rpgState: forestState(),
      progress: forestProgress([7, 8, 9, 1, 10, 11, 12]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 1, battle: 0.99 },
    })

    expect(result.kind).toBe('moved')
  })

  it('Guardian clear後の西側Woodsでfilter traceをRandom抽選より先に固定導入する', () => {
    const result = resolveWorldMove({
      rpgState: forestState(),
      progress: forestProgress([7, 8, 9, 1, 10, 11, 12, 13]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 1, battle: 0.01 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') throw new Error('expected fixed filter trace encounter')
    expect(result.battle.battleId).toBe(14)
    expect(result.battle.region).toBe('javascript')
  })

  it('filter trace clear後は同じWoodsで固定導入を繰り返さない', () => {
    const result = resolveWorldMove({
      rpgState: forestState(),
      progress: forestProgress([7, 8, 9, 1, 10, 11, 12, 13, 14]),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 1, battle: 0.99 },
    })

    expect(result.kind).toBe('moved')
  })
})
