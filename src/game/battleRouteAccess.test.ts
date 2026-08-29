import { describe, expect, it } from 'vitest'
import { isBattleRouteUnlocked } from './battleRouteAccess'

const progress = (clearedStageIds: number[], unlockedStageIds: number[] = [7]) => ({
  clearedStageIds,
  unlockedStageIds,
})

describe('battle route progression guard', () => {
  it('fresh saveはBattle 7だけを許可しstored unlock bitではbypassできない', () => {
    expect(isBattleRouteUnlocked('javascript', 7, progress([]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 1, progress([], [1, 7]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 8, progress([], [7, 8]))).toBe(false)
  })

  it('derives sequential JavaScript unlocks from canonical prerequisites', () => {
    expect(isBattleRouteUnlocked('javascript', 11, progress([10]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 22, progress([21]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 1, progress([22]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 2, progress([1], [2]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 2, progress([22, 1]))).toBe(true)
  })

  it('allows the JavaScript Boss only after the final lesson and Battle 1 / 2 are complete', () => {
    expect(isBattleRouteUnlocked('javascript', 3, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1, 2]))).toBe(true)
  })

  it('blocks TypeScript until JavaScript Boss clear and requires the prior TS chapter', () => {
    expect(isBattleRouteUnlocked('typescript', 4, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 4, progress([3]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 5, progress([4], [5]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 5, progress([3, 4]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 6, progress([3, 4, 5]))).toBe(true)
  })

  it('allows replay of an already-cleared battle and rejects unknown IDs', () => {
    expect(isBattleRouteUnlocked('javascript', 12, progress([12]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 999, progress([], [999]))).toBe(false)
  })
})
