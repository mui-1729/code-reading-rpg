import { describe, expect, it } from 'vitest'
import {
  createInitialRpgState,
  restoreRpgState,
  serializeRpgState,
} from '../rpg/state'
import {
  getChartSafeTerrain,
  isWorldCellRevealed,
  revealWorldPosition,
} from './worldExploration'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  WORLD_MAP_STARTS,
} from './worldMap'

describe('world exploration state', () => {
  it('現在地のChebyshev radius 2を開示し、移動後も過去のcellを蓄積する', () => {
    const base = createInitialRpgState()
    const initial = revealWorldPosition({
      ...base,
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[JS_FOREST_MAP_ID] },
      revealedWorldCells: {},
      ownedWorldMapIds: [],
    })

    expect(initial.revealedWorldCells[JS_FOREST_MAP_ID]).toHaveLength(25)
    expect(isWorldCellRevealed(initial, JS_FOREST_MAP_ID, { x: 52, y: 20 })).toBe(true)
    expect(isWorldCellRevealed(initial, JS_FOREST_MAP_ID, { x: 49, y: 20 })).toBe(false)

    const moved = revealWorldPosition({ ...initial, worldPosition: { x: 50, y: 20 } })
    expect(moved.revealedWorldCells[JS_FOREST_MAP_ID]).toHaveLength(35)
    expect(isWorldCellRevealed(moved, JS_FOREST_MAP_ID, { x: 48, y: 20 })).toBe(true)
    expect(isWorldCellRevealed(moved, JS_FOREST_MAP_ID, { x: 54, y: 20 })).toBe(true)
  })

  it('version 8で探索cellと購入地図をsave / reloadして保持する', () => {
    const state = revealWorldPosition({
      ...createInitialRpgState(),
      worldMapId: JS_DEEP_FOREST_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[JS_DEEP_FOREST_MAP_ID] },
      revealedWorldCells: {},
      ownedWorldMapIds: [JS_FOREST_MAP_ID],
    })

    const restored = restoreRpgState(serializeRpgState(state))
    expect(restored.revealedWorldCells).toEqual(state.revealedWorldCells)
    expect(restored.ownedWorldMapIds).toEqual([JS_FOREST_MAP_ID])
  })

  it('version 7 saveは壊さず現在地周辺だけを初期探索記録として移行する', () => {
    const current = createInitialRpgState()
    const { revealedWorldCells: _revealed, ownedWorldMapIds: _charts, ...legacyState } = current
    const restored = restoreRpgState(JSON.stringify({ version: 7, state: legacyState }))

    expect(restored.revealedWorldCells.overworld).toHaveLength(25)
    expect(restored.ownedWorldMapIds).toEqual([])
  })

  it('購入地図用terrainは宝箱などの特殊地点を通常地形へ戻す', () => {
    expect(getChartSafeTerrain(JS_FOREST_MAP_ID, 'treasure')).toBe('woods')
    expect(getChartSafeTerrain(JS_DEEP_FOREST_MAP_ID, 'boss')).toBe('deep-woods')
    expect(getChartSafeTerrain(JS_FOREST_MAP_ID, 'water')).toBe('water')
  })
})
