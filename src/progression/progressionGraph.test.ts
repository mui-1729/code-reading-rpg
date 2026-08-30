import { describe, expect, it } from 'vitest'
import {
  getAreaBattleSequence,
  getCanonicalUnlockedStageIds,
  getNextAccessibleBattleId,
  getNextBattleId,
  isBattleAccessible,
} from './progressionGraph'

describe('canonical progression graph', () => {
  it('fresh saveはBattle 7だけに到達できる', () => {
    expect(getCanonicalUnlockedStageIds([])).toEqual([7])
    expect(isBattleAccessible(7, [])).toBe(true)
    expect(isBattleAccessible(1, [])).toBe(false)
    expect(isBattleAccessible(4, [])).toBe(false)
  })

  it('Village Training 7〜9後に最初のincident Battle 1が開く', () => {
    expect(isBattleAccessible(1, [7, 8])).toBe(false)
    expect(isBattleAccessible(1, [7, 8, 9])).toBe(true)
    expect(getNextAccessibleBattleId('javascript', [7, 8, 9])).toBe(1)
  })

  it('Battle 1を確認するまでForest本編へ進めない', () => {
    expect(isBattleAccessible(10, [7, 8, 9])).toBe(false)
    expect(isBattleAccessible(10, [7, 8, 9, 1])).toBe(true)
  })

  it('filter()を学ぶBattle 14後に二つ目のincident Battle 2が開く', () => {
    const through14 = [7, 8, 9, 1, 10, 11, 12, 13, 14]
    expect(isBattleAccessible(2, through14)).toBe(true)
    expect(isBattleAccessible(15, through14)).toBe(false)
    expect(isBattleAccessible(15, [...through14, 2])).toBe(true)
  })

  it('Final Boss 3は両incidentとDeep Forest完了を要求する', () => {
    expect(isBattleAccessible(3, [1, 2, 22])).toBe(true)
    expect(isBattleAccessible(3, [1, 22])).toBe(false)
    expect(isBattleAccessible(3, [1, 2])).toBe(false)
  })

  it('TypeScriptはJavaScript Final Bossのclearを要求する', () => {
    expect(isBattleAccessible(4, [])).toBe(false)
    expect(isBattleAccessible(4, [3])).toBe(true)
    expect(isBattleAccessible(5, [4])).toBe(false)
    expect(isBattleAccessible(5, [3, 4])).toBe(true)
  })

  it('next battle sequenceはincidentを追うWorld本編順を返す', () => {
    expect(getNextBattleId('javascript', 9)).toBe(1)
    expect(getNextBattleId('javascript', 1)).toBe(10)
    expect(getNextBattleId('javascript', 14)).toBe(2)
    expect(getNextBattleId('javascript', 2)).toBe(15)
    expect(getNextBattleId('javascript', 22)).toBe(3)
    expect(getNextBattleId('typescript', 4)).toBe(5)
  })

  it('JavaScript STATUS対象は19戦のままBattle IDではなく物語順で並ぶ', () => {
    const sequence = getAreaBattleSequence('javascript')
    expect(sequence).toHaveLength(19)
    expect(sequence).toEqual([7, 8, 9, 1, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3])
  })
})
