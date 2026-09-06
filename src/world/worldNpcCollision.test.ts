import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_VILLAGE_MAP_ID, TS_FRONTIER_MAP_ID } from './worldMap'

describe('static NPC collision', () => {
  it('Village residentのtileへ侵入せずpositionとencounter stepを維持する', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 8, y: 19 },
      stepsSinceEncounter: 4,
      encounterCount: 2,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: -1,
    })

    expect(result.kind).toBe('blocked')
    expect(result.nextState).toBe(state)
    expect(result.nextState.worldPosition).toEqual({ x: 8, y: 19 })
    expect(result.nextState.stepsSinceEncounter).toBe(4)
    expect(result.nextState.encounterCount).toBe(2)
  })

  it('TypeScript側のstatic NPCにも同じcollision ruleを適用する', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 29, y: 6 },
      stepsSinceEncounter: 6,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
    expect(result.nextState).toBe(state)
    expect(result.nextState.worldPosition).toEqual({ x: 29, y: 6 })
    expect(result.nextState.stepsSinceEncounter).toBe(6)
  })
})
