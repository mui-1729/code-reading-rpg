import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { getForestLearningZoneAtPosition } from './forestLearningZones'
import { JS_FOREST_MAP_ID } from './worldMap'

describe('Forest learning geography', () => {
  it('旧thicket境界は進行壁として扱わず通常の森として通過できる', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 7, 8, 9, 10],
      unlockedStageIds: [1, 7, 8, 9, 10, 11],
    }
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 48, y: 6 },
      stepsSinceEncounter: 2,
      forestLearningBattleZones: { 10: 'east-entry' as const },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress,
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 1, battle: 1 },
    })

    expect(result.kind).not.toBe('blocked')
    expect(result.nextState.worldPosition).toEqual({ x: 47, y: 6 })
  })

  it('Learning Battle候補地域は地形そのものではなく見えないzoneとして判定する', () => {
    expect(getForestLearningZoneAtPosition({ x: 47, y: 20 })).toBe('east-entry')
    expect(getForestLearningZoneAtPosition({ x: 44, y: 6 })).toBe('east-north')
    expect(getForestLearningZoneAtPosition({ x: 40, y: 12 })).toBe('riverbank')
    expect(getForestLearningZoneAtPosition({ x: 28, y: 25 })).toBe('center-south')
    expect(getForestLearningZoneAtPosition({ x: 12, y: 20 })).toBe('west-mid')
    expect(getForestLearningZoneAtPosition({ x: 52, y: 20 })).toBeNull()
  })
})
