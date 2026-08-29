import { describe, expect, it } from 'vitest'
import { createInitialRpgState, type RpgState } from '../rpg'
import { OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'
import { createDefeatRecoveryState, withBattleHp } from './resultHandoff'

describe('battle result handoff', () => {
  it('updates persistent HP without changing the rest of RPG state', () => {
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

  it('recovers defeat at the Overworld hub while preserving progression-adjacent RPG data', () => {
    const state: RpgState = {
      ...createInitialRpgState(),
      worldMapId: 'js-deep-forest',
      worldPosition: { x: 5, y: 10 },
      stepsSinceEncounter: 0,
      encounterCount: 8,
      partyMemberIds: ['byte'],
      openedTreasureIds: ['js-debug-cache'],
    }

    const next = createDefeatRecoveryState(state, 128)

    expect(next.currentHp).toBe(128)
    expect(next.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(next.worldPosition).toEqual(WORLD_START)
    expect(next.stepsSinceEncounter).toBe(8)
    expect(next.encounterCount).toBe(8)
    expect(next.partyMemberIds).toEqual(['byte'])
    expect(next.openedTreasureIds).toEqual(['js-debug-cache'])
  })
})
