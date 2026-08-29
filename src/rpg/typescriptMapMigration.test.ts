import { describe, expect, it } from 'vitest'
import { restoreRpgState } from './state'
import { TS_FRONTIER_MAP_ID } from '../world/worldMap'

function storedAt(x: number, y: number) {
  return JSON.stringify({
    version: 4,
    state: {
      equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
      ownedEquipmentIds: ['training-blade', 'traveler-coat'],
      partyMemberIds: ['byte'],
      partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
      worldMapId: 'overworld',
      worldPosition: { x, y },
      stepsSinceEncounter: 6,
      encounterCount: 3,
      currentHp: 81,
      openedTreasureIds: ['ts-supply-cache'],
    },
  })
}

describe('TypeScript map save migration', () => {
  it('moves legacy overworld TypeScript-side positions into the dedicated frontier map', () => {
    const state = restoreRpgState(storedAt(30, 14), 100)

    expect(state.worldMapId).toBe(TS_FRONTIER_MAP_ID)
    expect(state.worldPosition).toEqual({ x: 9, y: 14 })
    expect(state.partyMemberIds).toEqual(['byte'])
    expect(state.encounterCount).toBe(3)
    expect(state.openedTreasureIds).toEqual(['ts-supply-cache'])
  })

  it('keeps hub and JavaScript overworld positions on the overworld map', () => {
    const state = restoreRpgState(storedAt(22, 14), 100)

    expect(state.worldMapId).toBe('overworld')
    expect(state.worldPosition).toEqual({ x: 22, y: 14 })
  })
})
