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
    expect(isBattleRouteUnlocked('javascript', 22, progress([21], [1, 4, 7, 22]))).toBe(true)
  })

  it('keeps the JavaScript Boss behind both unlock state and Deep Forest completion', () => {
    expect(isBattleRouteUnlocked('javascript', 3, progress([], [1, 3, 4, 7]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22], [1, 3, 4, 7]))).toBe(true)
  })

  it('blocks TypeScript until JavaScript Boss clear even when Battle 4 is initially listed as unlocked', () => {
    expect(isBattleRouteUnlocked('typescript', 4, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 4, progress([3]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 5, progress([3], [1, 4, 5, 7]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 6, progress([3], [1, 4, 5, 7]))).toBe(false)
  })

  it('allows replay of an already-cleared battle and rejects unknown IDs', () => {
    expect(isBattleRouteUnlocked('javascript', 12, progress([12]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 999, progress([], [999]))).toBe(false)
  })
})
