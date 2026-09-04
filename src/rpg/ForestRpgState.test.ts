import { describe, expect, it } from 'vitest'
import { JS_FOREST_MAP_ID, OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'
import { createInitialRpgState, restoreRpgState, serializeRpgState } from './state'

describe('JavaScript forest RPG state', () => {
  it('v4 saveでForest map IDとlocal positionを保存・復元する', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 34, y: 11 },
      stepsSinceEncounter: 6,
      encounterCount: 3,
    }

    expect(restoreRpgState(serializeRpgState(state))).toEqual(state)
  })

  it('Forest範囲外の座標はOverworld開始位置へfallbackする', () => {
    const state = createInitialRpgState()
    const restored = restoreRpgState(
      JSON.stringify({
        version: 4,
        state: {
          ...state,
          worldMapId: JS_FOREST_MAP_ID,
          worldPosition: { x: 43, y: 21 },
        },
      }),
    )

    expect(restored.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(restored.worldPosition).toEqual(WORLD_START)
  })
})
