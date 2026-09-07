import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { getWorldRecoveryStopAtPosition } from './recoveryStops'
import { JS_FOREST_MAP_ID } from './worldMap'

describe('world recovery stops', () => {
  it('Forestの野営地はfield上の物体として座標から取得できる', () => {
    expect(getWorldRecoveryStopAtPosition(JS_FOREST_MAP_ID, { x: 22, y: 32 })).toMatchObject({
      id: 'forest-traveler-camp',
      label: '野営地',
      recoveryRatio: 0.6,
    })
  })

  it('野営地のマスへは侵入せず隣接位置に留まる', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 22, y: 33 },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: -1,
    })

    expect(result.kind).toBe('blocked')
    expect(result.nextState).toBe(state)
    expect(result.nextState.worldPosition).toEqual({ x: 22, y: 33 })
  })
})
