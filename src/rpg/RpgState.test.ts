import { describe, expect, it } from 'vitest'
import {
  createInitialRpgState,
  restoreRpgState,
  serializeRpgState,
} from './state'

describe('RPG state storage', () => {
  it('装備・仲間・World座標・Encounter状態を保存して復元する', () => {
    const initial = createInitialRpgState()
    const state = {
      ...initial,
      partyMemberIds: ['byte'],
      partyEquipment: {
        byte: { weapon: null, armor: null, accessory: 'debug-charm' },
      },
      equipment: { ...initial.equipment, accessory: 'debug-charm' },
      worldPosition: { x: 7, y: 9 },
      stepsSinceEncounter: 3,
      encounterCount: 4,
    }

    expect(restoreRpgState(serializeRpgState(state))).toEqual(state)
  })

  it('壊れたstorageは初期状態へfallbackする', () => {
    expect(restoreRpgState('{bad json')).toEqual(createInitialRpgState())
    expect(restoreRpgState(JSON.stringify({ version: 999, state: {} }))).toEqual(
      createInitialRpgState(),
    )
  })
})
