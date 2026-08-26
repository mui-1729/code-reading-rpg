import { describe, expect, it } from 'vitest'
import type { PlayerStats } from '../progression'
import { createInitialRpgState } from './RpgState'
import { getCombatStats, getIncomingDamage, getSkillDamage } from './combat'
import { equipItem } from './equipment'
import { getPartyFollowUpDamage } from './party'

const baseStats: PlayerStats = {
  level: 1,
  maxHp: 100,
  powerMultiplier: 1,
}

describe('RPG combat stats', () => {
  it('装備bonusをMax HP / Attack / Defenseへ反映する', () => {
    const state = createInitialRpgState()
    const stats = getCombatStats(baseStats, state)

    expect(stats.maxHp).toBe(108)
    expect(stats.attack).toBe(13)
    expect(stats.defense).toBe(6)
  })

  it('装備変更でcombat statsが即時変わる', () => {
    const state = createInitialRpgState()
    const next = { ...state, equipment: equipItem(state.equipment, 'debug-charm') }
    const stats = getCombatStats(baseStats, next)

    expect(stats.attack).toBe(15)
    expect(stats.defense).toBe(7)
  })

  it('AttackはSkill damageへ、Defenseは被damage軽減へ反映する', () => {
    const stats = getCombatStats(baseStats, createInitialRpgState())
    expect(getSkillDamage(34, stats)).toBeGreaterThan(34)
    expect(getIncomingDamage(10, stats.defense)).toBeLessThan(10)
    expect(getIncomingDamage(1, 999)).toBe(1)
  })

  it('加入した仲間だけが同じtargetへのfollow-up damageを追加する', () => {
    expect(getPartyFollowUpDamage([], 1)).toBe(0)
    expect(getPartyFollowUpDamage(['byte'], 1)).toBe(7)
    expect(getPartyFollowUpDamage(['byte'], 3)).toBe(9)
  })
})
