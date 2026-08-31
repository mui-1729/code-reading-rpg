import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldInteraction, resolveWorldMove } from './worldActions'
import {
  getTerrain,
  isWalkableTerrain,
  JS_FOREST_MAP_ID,
  JS_FOREST_MIDBOSS_POSITION,
} from './worldMap'

function forestState(position: { x: number; y: number }) {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: position,
  }
}

describe('JavaScript Forest trace guardian', () => {
  it('main trail西側へ固定Guardian objectを置き、clear前は直接踏めない', () => {
    expect(
      getTerrain(JS_FOREST_MIDBOSS_POSITION.x, JS_FOREST_MIDBOSS_POSITION.y, JS_FOREST_MAP_ID),
    ).toBe('midboss')
    expect(isWalkableTerrain('midboss')).toBe(false)

    const result = resolveWorldMove({
      rpgState: forestState({
        x: JS_FOREST_MIDBOSS_POSITION.x + 1,
        y: JS_FOREST_MIDBOSS_POSITION.y,
      }),
      progress: createInitialPlayerProgress(),
      dx: -1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('midboss')
  })

  it('condition junction未clearではGuardian interactionを開始できない', () => {
    const progress = createInitialPlayerProgress()
    const intent = resolveWorldInteraction(
      forestState({
        x: JS_FOREST_MIDBOSS_POSITION.x + 1,
        y: JS_FOREST_MIDBOSS_POSITION.y,
      }),
      { ...progress, clearedStageIds: [7, 8, 9, 1, 10, 11] },
    )

    expect(intent).toMatchObject({
      kind: 'midboss',
      battleId: 13,
      region: 'javascript',
      unlocked: false,
    })
  })

  it('condition junction clear後は固定Guardian Battleを開始できる', () => {
    const progress = createInitialPlayerProgress()
    const intent = resolveWorldInteraction(
      forestState({
        x: JS_FOREST_MIDBOSS_POSITION.x + 1,
        y: JS_FOREST_MIDBOSS_POSITION.y,
      }),
      {
        ...progress,
        clearedStageIds: [7, 8, 9, 1, 10, 11, 12],
        unlockedStageIds: [...progress.unlockedStageIds, 13],
      },
    )

    expect(intent).toEqual({
      kind: 'midboss',
      battleId: 13,
      region: 'javascript',
      unlocked: true,
      seed: 'midboss:js-forest:0',
    })
  })

  it('Guardian clear後は地点をroadとして通過でき、interactionも消える', () => {
    const progress = createInitialPlayerProgress()
    const clearedProgress = {
      ...progress,
      clearedStageIds: [7, 8, 9, 1, 10, 11, 12, 13],
      unlockedStageIds: [...progress.unlockedStageIds, 13],
    }
    const state = forestState({
      x: JS_FOREST_MIDBOSS_POSITION.x + 1,
      y: JS_FOREST_MIDBOSS_POSITION.y,
    })

    const moveResult = resolveWorldMove({
      rpgState: state,
      progress: clearedProgress,
      dx: -1,
      dy: 0,
    })

    expect(moveResult.kind).toBe('moved')
    expect(moveResult.terrain).toBe('road')
    expect(moveResult.nextState.worldPosition).toEqual(JS_FOREST_MIDBOSS_POSITION)
    expect(resolveWorldInteraction(state, clearedProgress)).toEqual({ kind: 'none' })
  })
})
