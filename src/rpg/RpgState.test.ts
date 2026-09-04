import { describe, expect, it } from 'vitest'
import {
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_START,
} from '../world/worldMap'
import {
  createInitialRpgState,
  restoreRpgState,
  serializeRpgState,
  type RpgState,
} from './state'

describe('RPG state storage', () => {
  it('validな装備・仲間・Map座標・Encounter状態・current HP・Treasure状態を保存して復元する', () => {
    const initial = createInitialRpgState()
    const state: RpgState = {
      ...initial,
      ownedEquipmentIds: [...initial.ownedEquipmentIds, 'debug-charm'],
      partyMemberIds: ['byte'],
      equipment: { ...initial.equipment, accessory: 'debug-charm' },
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 10, y: 12 },
      stepsSinceEncounter: 3,
      encounterCount: 4,
      currentHp: 57,
      openedTreasureIds: ['js-debug-cache'],
    }

    const raw = serializeRpgState(state)
    expect(JSON.parse(raw).version).toBe(6)
    expect(restoreRpgState(raw)).toEqual(state)
  })

  it('v6は拡張Overworldのx>=23座標をTypeScript旧layoutと誤認しない', () => {
    const initial = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: { ...initial, worldMapId: OVERWORLD_MAP_ID, worldPosition: { x: 34, y: 33 } },
    })
    const restored = restoreRpgState(raw)
    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual({ x: 34, y: 33 })
  })

  it('v5以前の旧Overworld TypeScript側だけはdedicated frontierへmigrationする', () => {
    const initial = createInitialRpgState()
    const raw = JSON.stringify({
      version: 5,
      state: { ...initial, worldMapId: OVERWORLD_MAP_ID, worldPosition: { x: 30, y: 14 } },
    })
    const restored = restoreRpgState(raw)
    expect(restored.worldMapId).toBe(TS_FRONTIER_MAP_ID)
    expect(restored.worldPosition).toEqual({ x: 9, y: 14 })
  })

  it('v1 saveは装備込みmax HPと未開封Treasureのoverworld stateへmigrationする', () => {
    const initial = createInitialRpgState()
    const legacyState = {
      equipment: initial.equipment,
      ownedEquipmentIds: initial.ownedEquipmentIds,
      partyMemberIds: initial.partyMemberIds,
      partyEquipment: {},
      worldPosition: { x: 12, y: 14 },
      stepsSinceEncounter: 5,
      encounterCount: 2,
    }
    const restored = restoreRpgState(JSON.stringify({ version: 1, state: legacyState }))

    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual({ x: 12, y: 14 })
    expect(restored.currentHp).toBe(108)
    expect(restored.openedTreasureIds).toEqual([])
  })

  it('v2 saveはcurrent HPを維持しTreasureだけ未開封でoverworldへmigrationする', () => {
    const initial = createInitialRpgState()
    const legacyState = {
      equipment: initial.equipment,
      ownedEquipmentIds: initial.ownedEquipmentIds,
      partyMemberIds: initial.partyMemberIds,
      partyEquipment: {},
      worldPosition: { x: 16, y: 14 },
      stepsSinceEncounter: 4,
      encounterCount: 3,
      currentHp: 61,
    }
    const restored = restoreRpgState(JSON.stringify({ version: 2, state: legacyState }))

    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual({ x: 16, y: 14 })
    expect(restored.currentHp).toBe(61)
    expect(restored.openedTreasureIds).toEqual([])
  })

  it('v3 saveはTreasureとcurrent HPを維持してoverworldへmigrationする', () => {
    const initial = createInitialRpgState()
    const legacyState = {
      equipment: initial.equipment,
      ownedEquipmentIds: initial.ownedEquipmentIds,
      partyMemberIds: initial.partyMemberIds,
      partyEquipment: {},
      worldPosition: { x: 7, y: 9 },
      stepsSinceEncounter: 3,
      encounterCount: 4,
      currentHp: 57,
      openedTreasureIds: ['js-debug-cache'],
    }
    const restored = restoreRpgState(JSON.stringify({ version: 3, state: legacyState }))

    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual({ x: 7, y: 9 })
    expect(restored.currentHp).toBe(57)
    expect(restored.openedTreasureIds).toEqual(['js-debug-cache'])
  })

  it('v4 current HPは0..max HPへclampし未知Treasure IDを除外する', () => {
    const initial = createInitialRpgState()
    const tooHigh = JSON.stringify({
      version: 4,
      state: {
        ...initial,
        currentHp: 999,
        openedTreasureIds: ['js-debug-cache', 'unknown-cache', 'js-debug-cache'],
      },
    })
    const negative = JSON.stringify({
      version: 4,
      state: { ...initial, currentHp: -20 },
    })

    expect(restoreRpgState(tooHigh).currentHp).toBe(108)
    expect(restoreRpgState(tooHigh).openedTreasureIds).toEqual(['js-debug-cache'])
    expect(restoreRpgState(negative).currentHp).toBe(0)
  })

  it('base max HPが上がったsave restoreでも装備込み上限を使う', () => {
    const initial = createInitialRpgState(116)
    const raw = JSON.stringify({
      version: 4,
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

  it('Overworld範囲外の座標はHub開始位置へ戻す', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: { ...state, worldPosition: { x: 999, y: -3 } },
    })

    const restored = restoreRpgState(raw)
    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual(WORLD_START)
  })

  it('未知map IDはOverworld開始位置へfallbackする', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: {
        ...state,
        worldMapId: 'unknown-map',
        worldPosition: { x: 10, y: 12 },
      },
    })

    const restored = restoreRpgState(raw)
    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual(WORLD_START)
  })

  it('Village範囲外の座標はOverworld開始位置へ戻す', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: {
        ...state,
        worldMapId: JS_VILLAGE_MAP_ID,
        worldPosition: { x: 39, y: 27 },
      },
    })

    const restored = restoreRpgState(raw)
    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual(WORLD_START)
  })

  it('新World bounds内の端座標は保持する', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: { ...state, worldPosition: { x: 68, y: 48 } },
    })

    expect(restoreRpgState(raw).worldPosition).toEqual({ x: 68, y: 48 })
  })

  it('未知Equipmentを除外しstarter所有を補完・重複排除する', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: {
        ...state,
        ownedEquipmentIds: ['branch-saber', 'branch-saber', 'unknown-sword'],
      },
    })

    expect(restoreRpgState(raw).ownedEquipmentIds).toEqual([
      'training-blade',
      'traveler-coat',
      'branch-saber',
    ])
  })

  it('旧saveで既に所持していたDebug Charmはstarterから外れても保持する', () => {
    const state = createInitialRpgState()
    const legacyState = {
      equipment: state.equipment,
      ownedEquipmentIds: ['training-blade', 'traveler-coat', 'debug-charm'],
      partyMemberIds: state.partyMemberIds,
      partyEquipment: {},
      worldPosition: state.worldPosition,
      stepsSinceEncounter: state.stepsSinceEncounter,
      encounterCount: state.encounterCount,
      currentHp: state.currentHp,
    }
    const raw = JSON.stringify({ version: 2, state: legacyState })

    expect(restoreRpgState(raw).ownedEquipmentIds).toContain('debug-charm')
  })

  it('装備中IDはknown・owned・slot一致を満たさなければ外す', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
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

  it('v4から未知Partyを除外し未使用partyEquipmentをcurrent modelから取り除く', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 4,
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
    expect(restored).not.toHaveProperty('partyEquipment')
    expect(JSON.parse(serializeRpgState(restored)).state).not.toHaveProperty('partyEquipment')
  })

  it('negative encounter countersは0へclampする', () => {
    const state = createInitialRpgState()
    const raw = JSON.stringify({
      version: 6,
      state: { ...state, stepsSinceEncounter: -8, encounterCount: -3 },
    })
    const restored = restoreRpgState(raw)

    expect(restored.stepsSinceEncounter).toBe(0)
    expect(restored.encounterCount).toBe(0)
  })
})
