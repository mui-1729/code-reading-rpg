import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import {
  JS_DEEP_FOREST_CORE_EXIT_POSITION,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_DEEP_FOREST_POSITION,
  JS_FOREST_MAP_ID,
  JS_FOREST_POSITION,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_GATE_POSITION,
  type WorldMapId,
} from './worldMap'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

const throughTraining = [1, 7, 8, 9]
const throughForest = [...throughTraining, 10, 11, 12, 13, 14]
const throughDeepForest = [...throughForest, 2, 15, 16, 17, 18, 19, 20, 21, 22]
const javascriptComplete = [...throughDeepForest, 3]

function progressWith(clearedStageIds: number[]) {
  return { ...createInitialPlayerProgress(), clearedStageIds }
}

function portalState(mapId: WorldMapId, position: { x: number; y: number }) {
  return { ...createInitialRpgState(), worldMapId: mapId, worldPosition: position }
}

describe('world portal progression guard', () => {
  it('単一のforged clear bitでは向くだけで止まりActionもlockedになる', () => {
    const cases = [
      {
        state: portalState(OVERWORLD_MAP_ID, { x: JS_FOREST_POSITION.x + 1, y: JS_FOREST_POSITION.y }),
        target: JS_FOREST_POSITION,
        progress: progressWith([9]),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(JS_FOREST_MAP_ID, {
          x: JS_FOREST_DEEP_FOREST_POSITION.x + 1,
          y: JS_FOREST_DEEP_FOREST_POSITION.y,
        }),
        target: JS_FOREST_DEEP_FOREST_POSITION,
        progress: progressWith([14]),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(JS_DEEP_FOREST_MAP_ID, {
          x: JS_DEEP_FOREST_CORE_EXIT_POSITION.x + 1,
          y: JS_DEEP_FOREST_CORE_EXIT_POSITION.y,
        }),
        target: JS_DEEP_FOREST_CORE_EXIT_POSITION,
        progress: progressWith([22]),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(OVERWORLD_MAP_ID, {
          x: TS_FRONTIER_GATE_POSITION.x - 1,
          y: TS_FRONTIER_GATE_POSITION.y,
        }),
        target: TS_FRONTIER_GATE_POSITION,
        progress: progressWith([3]),
        dx: 1,
        dy: 0,
      },
    ] as const

    for (const entry of cases) {
      expect(resolveWorldMove({ rpgState: entry.state, progress: entry.progress, dx: entry.dx, dy: entry.dy }).kind).toBe('blocked')
      expect(resolveWorldTargetInteraction(entry.state, entry.progress, entry.target).kind).toBe('locked-portal')
    }
  })

  it('canonical progressでも方向入力では止まり、正面Actionでportalを通れる', () => {
    const cases = [
      {
        state: portalState(OVERWORLD_MAP_ID, { x: JS_FOREST_POSITION.x + 1, y: JS_FOREST_POSITION.y }),
        target: JS_FOREST_POSITION,
        progress: progressWith(throughTraining),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(JS_FOREST_MAP_ID, {
          x: JS_FOREST_DEEP_FOREST_POSITION.x + 1,
          y: JS_FOREST_DEEP_FOREST_POSITION.y,
        }),
        target: JS_FOREST_DEEP_FOREST_POSITION,
        progress: progressWith(throughForest),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(JS_DEEP_FOREST_MAP_ID, {
          x: JS_DEEP_FOREST_CORE_EXIT_POSITION.x + 1,
          y: JS_DEEP_FOREST_CORE_EXIT_POSITION.y,
        }),
        target: JS_DEEP_FOREST_CORE_EXIT_POSITION,
        progress: progressWith(throughDeepForest),
        dx: -1,
        dy: 0,
      },
      {
        state: portalState(OVERWORLD_MAP_ID, {
          x: TS_FRONTIER_GATE_POSITION.x - 1,
          y: TS_FRONTIER_GATE_POSITION.y,
        }),
        target: TS_FRONTIER_GATE_POSITION,
        progress: progressWith(javascriptComplete),
        dx: 1,
        dy: 0,
      },
    ] as const

    for (const entry of cases) {
      expect(resolveWorldMove({ rpgState: entry.state, progress: entry.progress, dx: entry.dx, dy: entry.dy }).kind).toBe('blocked')
      const intent = resolveWorldTargetInteraction(entry.state, entry.progress, entry.target)
      expect(intent.kind).toBe('map-transition')
    }
  })
})
