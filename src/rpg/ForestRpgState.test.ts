import { describe, expect, it } from 'vitest'
import { JS_FOREST_MAP_ID, OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'
import { createInitialRpgState, restoreRpgState, serializeRpgState } from './state'

describe('JavaScript forest RPG state', () => {
  it('Forest map IDとlocal positionを保存・復元する', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 24, y: 25 },
      stepsSinceEncounter: 6,
      encounterCount: 3,
    }

    expect(restoreRpgState(serializeRpgState(state))).toEqual(state)
  })

  it('プレイヤーごとに決まったLearning Battle地域をreload後も保持する', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 40, y: 12 },
      forestLearningBattleZones: {
        10: 'east-entry' as const,
        11: 'riverbank' as const,
      },
    }

    expect(restoreRpgState(serializeRpgState(state)).forestLearningBattleZones).toEqual({
      10: 'east-entry',
      11: 'riverbank',
    })
  })

  it('不正なLearning Battle地域はsave復元時に捨てる', () => {
    const state = createInitialRpgState()
    const restored = restoreRpgState(
      JSON.stringify({
        version: 7,
        state: {
          ...state,
          forestLearningBattleZones: {
            10: 'unknown-zone',
            11: 'riverbank',
          },
        },
      }),
    )

    expect(restored.forestLearningBattleZones).toEqual({ 11: 'riverbank' })
  })

  it('拡張後のForest範囲外座標はOverworld開始位置へfallbackする', () => {
    const state = createInitialRpgState()
    const restored = restoreRpgState(
      JSON.stringify({
        version: 4,
        state: {
          ...state,
          worldMapId: JS_FOREST_MAP_ID,
          worldPosition: { x: 55, y: 21 },
        },
      }),
    )

    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual(WORLD_START)
  })
})
