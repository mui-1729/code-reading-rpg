import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_DEEP_FOREST_MAP_ID, JS_FOREST_MAP_ID } from './worldMap'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

describe('world recovery stop interaction', () => {
  it('Forestの野営地を正面targetとしてAction intentへ解決する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 20, y: 12 },
    }

    expect(
      resolveWorldTargetInteraction(rpgState, progress, { x: 20, y: 11 }),
    ).toMatchObject({
      kind: 'recovery-stop',
      stop: {
        id: 'forest-traveler-camp',
        label: '野営地',
        actionLabel: '野営地で休む',
        recoveryRatio: 0.6,
      },
    })
  })

  it('Deep Forestの湧き水を正面targetとしてAction intentへ解決する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { x: 16, y: 12 },
    }

    expect(
      resolveWorldTargetInteraction(rpgState, progress, { x: 16, y: 11 }),
    ).toMatchObject({
      kind: 'recovery-stop',
      stop: { id: 'deep-forest-spring', actionLabel: '湧き水で休む' },
    })
  })

  it.each([
    [JS_FOREST_MAP_ID, { x: 20, y: 12 }],
    [JS_DEEP_FOREST_MAP_ID, { x: 16, y: 12 }],
  ] as const)('%sでは休息sceneryへ歩き込まず向きだけ変えられる', (worldMapId, worldPosition) => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId,
      worldPosition,
    }

    const result = resolveWorldMove({ rpgState, progress, dx: 0, dy: -1 })
    expect(result.kind).toBe('blocked')
    expect(result.nextState.worldPosition).toEqual(worldPosition)
  })
})
