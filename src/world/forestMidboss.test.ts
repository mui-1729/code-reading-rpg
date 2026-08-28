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

describe('JavaScript Forest midboss', () => {
  it('main trail西側へ固定MID BOSS objectを置き、直接は踏めない', () => {
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

  it('Battle 12未clearではMID BOSS interactionを開始できない', () => {
    const progress = createInitialPlayerProgress()
    const intent = resolveWorldInteraction(
      forestState({
        x: JS_FOREST_MIDBOSS_POSITION.x + 1,
        y: JS_FOREST_MIDBOSS_POSITION.y,
      }),
      { ...progress, clearedStageIds: [7, 8, 9, 10, 11] },
    )

    expect(intent).toMatchObject({
      kind: 'midboss',
      battleId: 13,
      region: 'javascript',
      unlocked: false,
    })
  })

  it('Battle 12 clear後は固定Battle 13を開始できる', () => {
    const progress = createInitialPlayerProgress()
    const intent = resolveWorldInteraction(
      forestState({
        x: JS_FOREST_MIDBOSS_POSITION.x + 1,
        y: JS_FOREST_MIDBOSS_POSITION.y,
      }),
      { ...progress, clearedStageIds: [7, 8, 9, 10, 11, 12], unlockedStageIds: [...progress.unlockedStageIds, 13] },
    )

    expect(intent).toEqual({
      kind: 'midboss',
      battleId: 13,
      region: 'javascript',
      unlocked: true,
      seed: 'midboss:js-forest:0',
    })
  })
})
