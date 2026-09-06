import { describe, expect, it } from 'vitest'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  WORLD_MAP_STARTS,
} from './worldMap'
import {
  createWorldCheckpoint,
  inferLegacyWorldCheckpoint,
  normalizeWorldCheckpoint,
  registerCheckpointForMapEntry,
  registerWorldCheckpoint,
} from './worldCheckpoints'

describe('world checkpoints', () => {
  it('semantic idからcanonical map / positionを復元する', () => {
    expect(createWorldCheckpoint('central-hub')).toEqual({
      id: 'central-hub',
      mapId: OVERWORLD_MAP_ID,
      position: WORLD_MAP_STARTS[OVERWORLD_MAP_ID],
    })

    expect(
      normalizeWorldCheckpoint({
        id: 'greenfield-village',
        mapId: OVERWORLD_MAP_ID,
        position: { x: 999, y: 999 },
      }),
    ).toEqual({
      id: 'greenfield-village',
      mapId: JS_VILLAGE_MAP_ID,
      position: WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID],
    })
  })

  it('GREENFIELDへ入ると現在のsafe checkpointを更新する', () => {
    const state = {
      worldMapId: JS_VILLAGE_MAP_ID,
      safeCheckpoint: createWorldCheckpoint('central-hub'),
    }

    expect(registerCheckpointForMapEntry(state).safeCheckpoint.id).toBe('greenfield-village')
  })

  it('checkpoint対象外mapへの移動は最後のsafe hubを上書きしない', () => {
    const state = {
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      safeCheckpoint: createWorldCheckpoint('greenfield-village'),
    }

    expect(registerCheckpointForMapEntry(state)).toBe(state)
  })

  it('同じcheckpointの再登録はstate identityを維持する', () => {
    const state = { safeCheckpoint: createWorldCheckpoint('greenfield-village') }
    expect(registerWorldCheckpoint(state, 'greenfield-village')).toBe(state)
  })

  it('legacy saveはJavaScript local mapならGREENFIELD、それ以外は中央Hubへfallbackする', () => {
    expect(inferLegacyWorldCheckpoint(JS_DEEP_FOREST_MAP_ID).id).toBe('greenfield-village')
    expect(inferLegacyWorldCheckpoint(OVERWORLD_MAP_ID).id).toBe('central-hub')
  })
})
