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
} from './worldMap'

const throughTraining = [1, 7, 8, 9]
const throughForest = [...throughTraining, 10, 11, 12, 13, 14]
const throughDeepForest = [...throughForest, 2, 15, 16, 17, 18, 19, 20, 21, 22]
const javascriptComplete = [...throughDeepForest, 3]

function progressWith(clearedStageIds: number[]) {
  return { ...createInitialPlayerProgress(), clearedStageIds }
}

describe('world portal progression guard', () => {
  it('単一のforged clear bitだけではForest / Deep Forest / Code Core / TypeScriptへ入れない', () => {
    const forest = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: OVERWORLD_MAP_ID,
        worldPosition: { x: JS_FOREST_POSITION.x + 1, y: JS_FOREST_POSITION.y },
      },
      progress: progressWith([9]),
      dx: -1,
      dy: 0,
    })
    expect(forest.kind).toBe('blocked')

    const deepForest = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition: {
          x: JS_FOREST_DEEP_FOREST_POSITION.x + 1,
          y: JS_FOREST_DEEP_FOREST_POSITION.y,
        },
      },
      progress: progressWith([14]),
      dx: -1,
      dy: 0,
    })
    expect(deepForest.kind).toBe('blocked')

    const codeCore = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_DEEP_FOREST_MAP_ID,
        worldPosition: {
          x: JS_DEEP_FOREST_CORE_EXIT_POSITION.x + 1,
          y: JS_DEEP_FOREST_CORE_EXIT_POSITION.y,
        },
      },
      progress: progressWith([22]),
      dx: -1,
      dy: 0,
    })
    expect(codeCore.kind).toBe('blocked')

    const typeScript = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: OVERWORLD_MAP_ID,
        worldPosition: {
          x: TS_FRONTIER_GATE_POSITION.x - 1,
          y: TS_FRONTIER_GATE_POSITION.y,
        },
      },
      progress: progressWith([3]),
      dx: 1,
      dy: 0,
    })
    expect(typeScript.kind).toBe('blocked')
  })

  it('semantic ancestryを満たしたcanonical progressなら各portalを通れる', () => {
    const forest = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: OVERWORLD_MAP_ID,
        worldPosition: { x: JS_FOREST_POSITION.x + 1, y: JS_FOREST_POSITION.y },
      },
      progress: progressWith(throughTraining),
      dx: -1,
      dy: 0,
    })
    expect(forest.kind).toBe('transition')

    const deepForest = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_FOREST_MAP_ID,
        worldPosition: {
          x: JS_FOREST_DEEP_FOREST_POSITION.x + 1,
          y: JS_FOREST_DEEP_FOREST_POSITION.y,
        },
      },
      progress: progressWith(throughForest),
      dx: -1,
      dy: 0,
    })
    expect(deepForest.kind).toBe('transition')

    const codeCore = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: JS_DEEP_FOREST_MAP_ID,
        worldPosition: {
          x: JS_DEEP_FOREST_CORE_EXIT_POSITION.x + 1,
          y: JS_DEEP_FOREST_CORE_EXIT_POSITION.y,
        },
      },
      progress: progressWith(throughDeepForest),
      dx: -1,
      dy: 0,
    })
    expect(codeCore.kind).toBe('transition')

    const typeScript = resolveWorldMove({
      rpgState: {
        ...createInitialRpgState(),
        worldMapId: OVERWORLD_MAP_ID,
        worldPosition: {
          x: TS_FRONTIER_GATE_POSITION.x - 1,
          y: TS_FRONTIER_GATE_POSITION.y,
        },
      },
      progress: progressWith(javascriptComplete),
      dx: 1,
      dy: 0,
    })
    expect(typeScript.kind).toBe('transition')
  })
})
