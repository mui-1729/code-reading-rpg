import { describe, expect, it } from 'vitest'
import {
  getAreaBattleSequence,
  getAreaProgressionKeys,
  getCanonicalUnlockedStageIds,
  getNextAccessibleBattleId,
  getNextBattleId,
  getProgressionNode,
  isBattleAccessible,
} from './progressionGraph'

const throughFilter = [7, 8, 9, 1, 10, 11, 12, 13, 14]
const throughSecondIncident = [...throughFilter, 2]
const throughDeepForest = [...throughSecondIncident, 15, 16, 17, 18, 19, 20, 21, 22]
const javascriptComplete = [...throughDeepForest, 3]

describe('canonical progression graph', () => {
  it('fresh saveは最初のVillage preparationだけに到達できる', () => {
    expect(getCanonicalUnlockedStageIds([])).toEqual([7])
    expect(getProgressionNode(7)?.key).toBe('js-training-hp')
    expect(isBattleAccessible(7, [])).toBe(true)
    expect(isBattleAccessible(1, [])).toBe(false)
    expect(isBattleAccessible(4, [])).toBe(false)
  })

  it('Village preparation完了後に最初のincidentが開く', () => {
    expect(isBattleAccessible(1, [7, 8])).toBe(false)
    expect(isBattleAccessible(1, [7, 8, 9])).toBe(true)
    expect(getNextAccessibleBattleId('javascript', [7, 8, 9])).toBe(1)
    expect(getProgressionNode(1)?.key).toBe('js-incident-first')
  })

  it('最初のincidentを確認するまでForest traceへ進めない', () => {
    expect(isBattleAccessible(10, [7, 8, 9])).toBe(false)
    expect(isBattleAccessible(10, [7, 8, 9, 1])).toBe(true)
  })

  it('Forestで影響範囲を追った後に二つ目のincidentが開く', () => {
    expect(isBattleAccessible(2, throughFilter)).toBe(true)
    expect(isBattleAccessible(15, throughFilter)).toBe(false)
    expect(isBattleAccessible(15, throughSecondIncident)).toBe(true)
    expect(getProgressionNode(2)?.key).toBe('js-incident-second')
  })

  it('Final Bossはsemantic ancestryを含む正規route全体を要求する', () => {
    expect(isBattleAccessible(3, [1, 2, 22])).toBe(false)
    expect(isBattleAccessible(3, throughDeepForest.slice(0, -1))).toBe(false)
    expect(isBattleAccessible(3, throughDeepForest)).toBe(true)
    expect(getProgressionNode(3)?.key).toBe('js-final-code-core')
  })

  it('TypeScriptは独立したsemantic keyを持ちJavaScript Final後に始まる', () => {
    expect(getAreaProgressionKeys('typescript')).toEqual([
      'ts-api-contract',
      'ts-optional-union',
      'ts-final-shared-contract',
    ])
    expect(isBattleAccessible(4, throughDeepForest)).toBe(false)
    expect(isBattleAccessible(4, javascriptComplete)).toBe(true)
    expect(isBattleAccessible(5, [4])).toBe(false)
    expect(isBattleAccessible(5, [...javascriptComplete, 4])).toBe(true)
  })

  it('story orderはlegacy battleIdの大小ではなくsemantic routeで決まる', () => {
    expect(getNextBattleId('javascript', 9)).toBe(1)
    expect(getNextBattleId('javascript', 1)).toBe(10)
    expect(getNextBattleId('javascript', 14)).toBe(2)
    expect(getNextBattleId('javascript', 2)).toBe(15)
    expect(getNextBattleId('javascript', 22)).toBe(3)
    expect(getNextBattleId('typescript', 4)).toBe(5)
  })

  it('semantic keyは将来の追加でも番号を振り直さず読める', () => {
    expect(getAreaProgressionKeys('javascript')).toEqual([
      'js-training-hp',
      'js-training-name',
      'js-training-find',
      'js-incident-first',
      'js-forest-and',
      'js-forest-or',
      'js-forest-combined',
      'js-forest-guardian',
      'js-forest-filter',
      'js-incident-second',
      'js-deep-filter',
      'js-deep-map',
      'js-deep-some',
      'js-deep-every',
      'js-deep-guardian',
      'js-deep-sort',
      'js-deep-safe-read',
      'js-deep-reduce',
      'js-final-code-core',
    ])
    expect(getAreaBattleSequence('javascript')).toHaveLength(19)
  })
})
