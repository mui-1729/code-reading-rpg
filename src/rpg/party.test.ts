import { describe, expect, it } from 'vitest'
import { getPartyFollowUpDamage, getPartyMemberGrowth, getPartyRank } from './party'

describe('party growth', () => {
  it('Player Lv 1 / 3 / 5 / 7 / 9を節目にRank 1〜5へ成長する', () => {
    expect(getPartyRank(1)).toBe(1)
    expect(getPartyRank(2)).toBe(1)
    expect(getPartyRank(3)).toBe(2)
    expect(getPartyRank(5)).toBe(3)
    expect(getPartyRank(7)).toBe(4)
    expect(getPartyRank(9)).toBe(5)
    expect(getPartyRank(99)).toBe(5)
  })

  it('BYTEのRank上昇は追撃damageを2ずつ強化する', () => {
    expect(getPartyMemberGrowth('byte', 1)).toEqual({
      rank: 1,
      followUpDamage: 7,
      nextRankAtPlayerLevel: 3,
    })
    expect(getPartyMemberGrowth('byte', 5)).toEqual({
      rank: 3,
      followUpDamage: 11,
      nextRankAtPlayerLevel: 7,
    })
    expect(getPartyMemberGrowth('byte', 9)).toEqual({
      rank: 5,
      followUpDamage: 15,
      nextRankAtPlayerLevel: null,
    })
  })

  it('Battleで使う合計追撃値もmember growthと同じ計算を使う', () => {
    expect(getPartyFollowUpDamage([], 9)).toBe(0)
    expect(getPartyFollowUpDamage(['byte'], 1)).toBe(7)
    expect(getPartyFollowUpDamage(['byte'], 5)).toBe(11)
    expect(getPartyFollowUpDamage(['unknown'], 9)).toBe(0)
  })
})
