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

  it('Battle 1だけclearしてもBattle 2 / 3へbypassできない', () => {
    expect(isBattleAccessible(2, [1])).toBe(false)
    expect(isBattleAccessible(3, [1, 2])).toBe(false)
    expect(getCanonicalUnlockedStageIds([1])).not.toContain(2)
  })

  it('Battle 22 clear後にIncident Battle 1が開く', () => {
    expect(isBattleAccessible(1, [22])).toBe(true)
    expect(getNextAccessibleBattleId('javascript', [22])).toBe(7)
  })

  it('Battle 2 / 3はDeep Forest完了を含むcanonical prerequisiteを要求する', () => {
    expect(isBattleAccessible(2, [22, 1])).toBe(true)
    expect(isBattleAccessible(3, [22, 1, 2])).toBe(true)
    expect(isBattleAccessible(3, [1, 2])).toBe(false)
  })

  it('TypeScriptはJavaScript Final Bossのclearを要求する', () => {
    expect(isBattleAccessible(4, [])).toBe(false)
    expect(isBattleAccessible(4, [3])).toBe(true)
    expect(isBattleAccessible(5, [4])).toBe(false)
    expect(isBattleAccessible(5, [3, 4])).toBe(true)
  })

  it('next battle sequenceはWorld本編順を返す', () => {
    expect(getNextBattleId('javascript', 9)).toBe(10)
    expect(getNextBattleId('javascript', 22)).toBe(1)
    expect(getNextBattleId('javascript', 1)).toBe(2)
    expect(getNextBattleId('javascript', 2)).toBe(3)
    expect(getNextBattleId('typescript', 4)).toBe(5)
  })

  it('JavaScript STATUS対象はBattle 7〜22 + 1〜3の19戦', () => {
    expect(getAreaBattleSequence('javascript')).toHaveLength(19)
    expect(getAreaBattleSequence('javascript').slice(-3)).toEqual([1, 2, 3])
  })
})
