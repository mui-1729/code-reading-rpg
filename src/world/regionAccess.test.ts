import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { OVERWORLD_MAP_ID } from './worldMap'
import {
  isTypeScriptRegionUnlocked,
  normalizeLockedTypeScriptPosition,
  shouldBlockTypeScriptRegionMove,
} from './regionAccess'

describe('TypeScript region access', () => {
  it('Battle 3 clear前はOverworldのTypeScript境界を越えられない', () => {
    const progress = createInitialPlayerProgress()

    expect(isTypeScriptRegionUnlocked(progress)).toBe(false)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 22, 23, progress)).toBe(true)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 21, 22, progress)).toBe(false)
  })

  it('Battle 3 clear後はTypeScript地方を解放する', () => {
    const initial = createInitialPlayerProgress()
    const progress = { ...initial, clearedStageIds: [...initial.clearedStageIds, 3] }

    expect(isTypeScriptRegionUnlocked(progress)).toBe(true)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 22, 23, progress)).toBe(false)
  })

  it('未clearのold saveがTypeScript側にいる場合は境界へ戻す', () => {
    const progress = createInitialPlayerProgress()

    expect(normalizeLockedTypeScriptPosition(OVERWORLD_MAP_ID, { x: 30, y: 14 }, progress)).toEqual({
      x: 22,
      y: 14,
    })
  })
})
