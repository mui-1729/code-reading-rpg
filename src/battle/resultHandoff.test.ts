import { describe, expect, it } from 'vitest'
import { createInitialRpgState, type RpgState } from '../rpg'
import { withBattleHp } from './resultHandoff'

describe('battle result handoff', () => {
  it('updates attempt HP without changing the rest of RPG state', () => {
    const state: RpgState = {
      ...createInitialRpgState(),
      worldPosition: { x: 7, y: 9 },
      encounterCount: 12,
    }

    const next = withBattleHp(state, 43)

    expect(next.currentHp).toBe(43)
    expect(next.worldPosition).toEqual({ x: 7, y: 9 })
    expect(next.encounterCount).toBe(12)
  })
})
