import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { OVERWORLD_MAP_ID } from './worldMap'
import { isTypeScriptRegionUnlocked, shouldBlockTypeScriptRegionMove } from './regionAccess'

describe('TypeScript region access', () => {
  it('Battle 3 clear前はOverworldのTypeScript境界を越えられない', () => {
    const progress = createInitialPlayerProgress()

    expect(isTypeScriptRegionUnlocked(progress)).toBe(false)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 51, 52, progress)).toBe(true)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 50, 51, progress)).toBe(false)
  })

  it('Battle 3 clear後はTypeScript地方を解放する', () => {
    const initial = createInitialPlayerProgress()
    const progress = { ...initial, clearedStageIds: [...initial.clearedStageIds, 3] }

    expect(isTypeScriptRegionUnlocked(progress)).toBe(true)
    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 51, 52, progress)).toBe(false)
  })

  it('既にTypeScript側にいるold saveは通常導線gateで破壊しない', () => {
    const progress = createInitialPlayerProgress()

    expect(shouldBlockTypeScriptRegionMove(OVERWORLD_MAP_ID, 60, 61, progress)).toBe(false)
  })
})
