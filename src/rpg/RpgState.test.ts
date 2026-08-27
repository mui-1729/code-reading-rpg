import { describe, expect, it } from 'vitest'
import { WORLD_START } from '../world/worldMap'
import {
  createInitialRpgState,
  restoreRpgState,
  serializeRpgState,
} from './state'

describe('RPG state storage', () => {
  it('validな装備・仲間・World座標・Encounter状態・current HPを保存して復元する', () => {
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
      currentHp: 57,
    }

    expect(restoreRpgState(serializeRpgState(state))).toEqual(state)
  })

  it('v1 saveは装備込みmax HPでv2へmigrationする', () => {
    const initial = createInitialRpgState()
    const legacyState = {
      equipment: initial.equipment,
      ownedEquipmentIds: initial.ownedEquipmentIds,
      partyMemberIds: initial.partyMemberIds,
      partyEquipment: initial.partyEquipment,
      worldPosition: { x: 12, y: 14 },
      stepsSinceEncounter: 5,
      encounterCount: 2,
    }
    const restored = restoreRpgState(JSON.stringify({ version: 1, state: legacyState }))

    expect(restored.worldPosition).toEqual({ x: 12, y: 14 })
    expect(restored.currentHp).toBe(108)
  })

  it('v2 current HPは0..max HPへclampする', () => {
    const initial = createInitialRpgState()
    const tooHigh = JSON.stringify({
      version: 2,
      state: { ...initial, currentHp: 999 },
    })
    const negative = JSON.stringify({
      version: 2,
      state: { ...initial, currentHp: -20 },
    })

    expect(restoreRpgState(tooHigh).currentHp).toBe(108)
    expect(restoreRpgState(negative).currentHp).toBe(0)
  })

  it('base max HPが上がったsave restoreでも装備込み上限を使う', () => {
    const initial = createInitialRpgState(116)
    const raw = JSON.stringify({
      version: 2,
      state: { ...initial, currentHp: 999 },
    })

    expect(restoreRpgState(raw, 116).currentHp).toBe(124)
  })

  it('壊れたstorageと未知versionは初期状態へfallbackする', () => {
    expect(restoreRpgState('{bad json')).toEqual(createInitialRpgState())
    expect(restoreRpgState(JSON.stringify({ version: 999, state: {} }))).toEqual(
      createInitialRpgState(),
    )
  })

  it('World範囲外の座標はHub開始位置へ戻す', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: { ...state, worldPosition: { x: 999, y: -3 } },
    })

    expect(restoreRpgState(raw).worldPosition).toEqual(WORLD_START)
  })

  it('World bounds内の端座標は保持する', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: { ...state, worldPosition: { x: 39, y: 27 } },
    })

    expect(restoreRpgState(raw).worldPosition).toEqual({ x: 39, y: 27 })
  })

  it('未知Equipmentを除外しstarter所有を補完・重複排除する', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: {
        ...state,
        ownedEquipmentIds: ['branch-saber', 'branch-saber', 'unknown-sword'],
      },
    })

    expect(restoreRpgState(raw).ownedEquipmentIds).toEqual([
      'training-blade',
      'traveler-coat',
      'debug-charm',
      'branch-saber',
    ])
  })

  it('装備中IDはknown・owned・slot一致を満たさなければ外す', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: {
        ...state,
        ownedEquipmentIds: ['training-blade', 'traveler-coat', 'debug-charm'],
        equipment: {
          weapon: 'typed-mail',
          armor: 'traveler-coat',
          accessory: 'branch-saber',
        },
      },
    })

    expect(restoreRpgState(raw).equipment).toEqual({
      weapon: null,
      armor: 'traveler-coat',
      accessory: null,
    })
  })

  it('未知Partyを除外しjoined memberだけの装備へ正規化する', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: {
        ...state,
        partyMemberIds: ['byte', 'ghost', 'byte'],
        partyEquipment: {
          byte: { weapon: 'training-blade', armor: null, accessory: 'unknown-charm' },
          ghost: { weapon: 'training-blade', armor: null, accessory: null },
        },
      },
    })
    const restored = restoreRpgState(raw)

    expect(restored.partyMemberIds).toEqual(['byte'])
    expect(restored.partyEquipment).toEqual({
      byte: { weapon: 'training-blade', armor: null, accessory: null },
    })
  })

  it('negative encounter countersは0へclampする', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 2,
      state: { ...state, stepsSinceEncounter: -8, encounterCount: -3 },
    })
    const restored = restoreRpgState(raw)

    expect(restored.stepsSinceEncounter).toBe(0)
    expect(restored.encounterCount).toBe(0)
  })
})
