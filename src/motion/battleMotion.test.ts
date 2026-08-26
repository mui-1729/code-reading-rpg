import { describe, expect, it } from 'vitest'
import { BATTLE_MOTION, getNewlyDefeatedIds } from './battleMotion'

describe('battle motion', () => {
  it('今回の攻撃で0HPになった対象だけを撃破演出対象にする', () => {
    const before = [
      { id: 'a', hp: 20 },
      { id: 'b', hp: 0 },
      { id: 'c', hp: 5 },
    ]
    const after = [
      { id: 'a', hp: 0 },
      { id: 'b', hp: 0 },
      { id: 'c', hp: 2 },
    ]

    expect(getNewlyDefeatedIds(before, after)).toEqual(['a'])
  })

  it('motion durationは短いBattleテンポの範囲に収める', () => {
    expect(BATTLE_MOTION.skillWindupMs).toBeLessThanOrEqual(200)
    expect(BATTLE_MOTION.hitMs).toBeLessThanOrEqual(500)
    expect(BATTLE_MOTION.playerHitMs).toBeLessThanOrEqual(500)
    expect(BATTLE_MOTION.resultDelayMs).toBeLessThanOrEqual(250)
  })
})
