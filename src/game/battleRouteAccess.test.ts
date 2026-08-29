import { describe, expect, it } from 'vitest'
import { isBattleRouteUnlocked } from './battleRouteAccess'

const progress = (clearedStageIds: number[], unlockedStageIds: number[] = [1, 4, 7]) => ({
  clearedStageIds,
  unlockedStageIds,
})

describe('battle route progression guard', () => {
  it('allows explicitly unlocked JavaScript Battles and blocks locked lessons', () => {
    expect(isBattleRouteUnlocked('javascript', 1, progress([]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 7, progress([]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 8, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 8, progress([7], [1, 4, 7, 8]))).toBe(true)
  })

  it('derives sequential JavaScript unlocks for compatible saves', () => {
    expect(isBattleRouteUnlocked('javascript', 11, progress([10]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 22, progress([21]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 2, progress([1]))).toBe(true)
  })

  it('allows the JavaScript Boss only after the final lesson and Battle 1 / 2 are complete', () => {
    expect(isBattleRouteUnlocked('javascript', 3, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1, 2]))).toBe(true)
  })

  it('blocks TypeScript until JavaScript Boss clear and derives later chapter unlocks', () => {
    expect(isBattleRouteUnlocked('typescript', 4, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 4, progress([3]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 5, progress([3, 4]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 6, progress([3, 5]))).toBe(true)
  })

  it('allows replay of an already-cleared battle and rejects unknown IDs', () => {
    expect(isBattleRouteUnlocked('javascript', 12, progress([12]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 999, progress([], [999]))).toBe(false)
  })
})
