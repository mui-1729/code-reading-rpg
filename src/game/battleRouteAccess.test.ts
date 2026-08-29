import { describe, expect, it } from 'vitest'
import { isBattleRouteUnlocked } from './battleRouteAccess'

const progress = (clearedStageIds: number[]) => ({ clearedStageIds })

describe('battle route progression guard', () => {
  it('allows the first JavaScript training battle but blocks later lessons until prerequisites clear', () => {
    expect(isBattleRouteUnlocked('javascript', 7, progress([]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 8, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 8, progress([7]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 22, progress([20]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 22, progress([21]))).toBe(true)
  })

  it('keeps Battle 1 / 2 / Boss behind the JavaScript learning route', () => {
    expect(isBattleRouteUnlocked('javascript', 1, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 1, progress([22]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 2, progress([22]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 2, progress([22, 1]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress([22, 1, 2]))).toBe(true)
  })

  it('blocks TypeScript until JavaScript Boss clear, then preserves 4 -> 5 -> 6 order', () => {
    expect(isBattleRouteUnlocked('typescript', 4, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 4, progress([3]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 5, progress([3]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 5, progress([3, 4]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 6, progress([3, 4]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 6, progress([3, 4, 5]))).toBe(true)
  })

  it('allows replay of an already-cleared battle and rejects unknown IDs', () => {
    expect(isBattleRouteUnlocked('javascript', 12, progress([12]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 999, progress([]))).toBe(false)
  })
})
