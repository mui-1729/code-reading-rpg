import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { getWorldNpcAtPosition } from './worldCharacters'
import {
  getTerrain,
  getWorldMapDimensions,
  getWorldMapLabel,
  isEncounterTerrain,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION,
  JS_FOREST_SETTLEMENT_FOREST_EXIT_POSITION,
  JS_FOREST_SETTLEMENT_MAP_ID,
  JS_FOREST_SETTLEMENT_POSITION,
  WORLD_MAP_STARTS,
} from './worldMap'
import { getVillageFacilityAtPosition } from './villageFacilityData'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

const throughForest = [1, 7, 8, 9, 10, 11, 12, 13, 14]

describe('Forest Settlement', () => {
  it('ForestとDeep Forestの間に独立したsafe local mapとして存在する', () => {
    expect(getWorldMapDimensions(JS_FOREST_SETTLEMENT_MAP_ID)).toEqual({ width: 23, height: 17 })
    expect(getWorldMapLabel(JS_FOREST_SETTLEMENT_MAP_ID)).toBe('森番の集落')
    expect(getTerrain(11, 8, JS_FOREST_SETTLEMENT_MAP_ID)).toBe('road')
    expect(isEncounterTerrain(getTerrain(11, 8, JS_FOREST_SETTLEMENT_MAP_ID))).toBe(false)
  })

  it('Forestを抜けて入場すると第二safe checkpointを自動登録する', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: throughForest }
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: JS_FOREST_SETTLEMENT_POSITION.x + 1, y: JS_FOREST_SETTLEMENT_POSITION.y },
    }

    const intent = resolveWorldTargetInteraction(state, progress, JS_FOREST_SETTLEMENT_POSITION)
    expect(intent.kind).toBe('map-transition')
    if (intent.kind !== 'map-transition') return
    expect(intent.toMapId).toBe(JS_FOREST_SETTLEMENT_MAP_ID)
    expect(intent.nextState.worldPosition).toEqual(WORLD_MAP_STARTS[JS_FOREST_SETTLEMENT_MAP_ID])
    expect(intent.nextState.safeCheckpoint).toMatchObject({
      id: 'forest-settlement',
      mapId: JS_FOREST_SETTLEMENT_MAP_ID,
      position: { x: 11, y: 11 },
    })
  })

  it('宿・補給所・住民を持ち、GREENFIELDの単なる通過点にならない', () => {
    expect(getVillageFacilityAtPosition(JS_FOREST_SETTLEMENT_MAP_ID, { x: 7, y: 11 })).toMatchObject({
      kind: 'inn',
      checkpointId: 'forest-settlement',
      locationLabel: '森番の集落',
    })
    expect(getVillageFacilityAtPosition(JS_FOREST_SETTLEMENT_MAP_ID, { x: 15, y: 11 })).toMatchObject({
      kind: 'item-shop',
      locationLabel: '森番の集落',
    })
    expect(getWorldNpcAtPosition(JS_FOREST_SETTLEMENT_MAP_ID, { x: 11, y: 6 })?.npcId).toBe('lambda-sage')
  })

  it('集落からDeep Forestへ進んでもcheckpointは森番の集落に残る', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: throughForest }
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_SETTLEMENT_MAP_ID,
      worldPosition: {
        x: JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION.x,
        y: JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION.y + 1,
      },
      safeCheckpoint: {
        id: 'forest-settlement' as const,
        mapId: JS_FOREST_SETTLEMENT_MAP_ID,
        position: { x: 11, y: 11 },
      },
    }

    const intent = resolveWorldTargetInteraction(
      state,
      progress,
      JS_FOREST_SETTLEMENT_DEEP_FOREST_POSITION,
    )
    expect(intent.kind).toBe('map-transition')
    if (intent.kind !== 'map-transition') return
    expect(intent.toMapId).toBe(JS_DEEP_FOREST_MAP_ID)
    expect(intent.nextState.safeCheckpoint.id).toBe('forest-settlement')
  })

  it('Forestへ戻る出口もAction targetとして維持する', () => {
    expect(
      getTerrain(
        JS_FOREST_SETTLEMENT_FOREST_EXIT_POSITION.x,
        JS_FOREST_SETTLEMENT_FOREST_EXIT_POSITION.y,
        JS_FOREST_SETTLEMENT_MAP_ID,
      ),
    ).toBe('exit')
  })
})
