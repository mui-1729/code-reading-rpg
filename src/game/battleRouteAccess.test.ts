import { describe, expect, it } from 'vitest'
import { isBattleRouteUnlocked } from './battleRouteAccess'

const progress = (clearedStageIds: number[], unlockedStageIds: number[] = [1]) => ({
  clearedStageIds,
  unlockedStageIds,
})

const trainingComplete = [1, 7, 8, 9]
const throughFilter = [...trainingComplete, 10, 11, 12, 13, 14]
const throughSecondIncident = [...throughFilter, 2]
const throughDeepForest = [...throughSecondIncident, 15, 16, 17, 18, 19, 20, 21, 22]

describe('battle route progression guard', () => {
  it('fresh saveはlive incidentを許可しstored unlock bitでは後続をbypassできない', () => {
    expect(isBattleRouteUnlocked('javascript', 1, progress([]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 7, progress([], [1, 7]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 8, progress([], [1, 7, 8]))).toBe(false)
  })

  it('first incident後にVillage prep、その完了後にForest traceを順番に開く', () => {
    expect(isBattleRouteUnlocked('javascript', 7, progress([1]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 10, progress([1, 7, 8]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 10, progress(trainingComplete))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 11, progress([...trainingComplete, 10]))).toBe(true)
  })

  it('second incidentはfilter trace後、Deep Forest lessonはsecond incident後に開く', () => {
    expect(isBattleRouteUnlocked('javascript', 2, progress(throughFilter))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 15, progress(throughFilter))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 15, progress(throughSecondIncident))).toBe(true)
  })

  it('Final Bossは正規incident routeとDeep Forest最終traceをすべて要求する', () => {
    expect(isBattleRouteUnlocked('javascript', 3, progress([]))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress(throughDeepForest.slice(0, -1)))).toBe(false)
    expect(isBattleRouteUnlocked('javascript', 3, progress(throughDeepForest))).toBe(true)
  })

  it('TypeScriptはJavaScript Final clearとprior TypeScript chapterを要求する', () => {
    const jsComplete = [...throughDeepForest, 3]
    expect(isBattleRouteUnlocked('typescript', 4, progress(throughDeepForest))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 4, progress(jsComplete))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 5, progress([4], [5]))).toBe(false)
    expect(isBattleRouteUnlocked('typescript', 5, progress([...jsComplete, 4]))).toBe(true)
    expect(isBattleRouteUnlocked('typescript', 6, progress([...jsComplete, 4, 5]))).toBe(true)
  })

  it('allows replay of an already-cleared battle and rejects unknown IDs', () => {
    expect(isBattleRouteUnlocked('javascript', 12, progress([12]))).toBe(true)
    expect(isBattleRouteUnlocked('javascript', 999, progress([], [999]))).toBe(false)
  })
})
