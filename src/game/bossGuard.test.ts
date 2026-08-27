import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { BOSS_GUARD_CODE, getBossGuardedDamage, isBossGuardActive } from './bossGuard'
import { getSkillCardsForBattle } from './skills'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (name: string, hp: number): Enemy => ({
  id: name.toLowerCase(),
  name,
  hp,
  maxHp: hp,
  attackName: 'test',
  attackDamage: 1,
  glyph: '?',
})

describe('Boss GUARD', () => {
  it('Boss Battleでminionが生存中だけACTIVEになる', () => {
    const enemies = [enemy('Slime', 10), enemy('Boss', 100)]

    expect(BOSS_GUARD_CODE).toBe('enemies.some(e => e.name !== "Boss" && e.hp > 0)')
    expect(isBossGuardActive(enemies, true)).toBe(true)
    expect(isBossGuardActive([{ ...enemies[0], hp: 0 }, enemies[1]], true)).toBe(false)
    expect(isBossGuardActive(enemies, false)).toBe(false)
  })

  it('GUARD中はBossへのdamageだけを1へ抑える', () => {
    const slime = enemy('Slime', 10)
    const boss = enemy('Boss', 100)
    const enemies = [slime, boss]

    expect(getBossGuardedDamage(boss, 80, enemies, true)).toBe(1)
    expect(getBossGuardedDamage(slime, 80, enemies, true)).toBe(80)
    expect(getBossGuardedDamage(boss, 80, enemies, false)).toBe(80)
  })

  it('minion全滅後はBossへ通常damageを通す', () => {
    const enemies = [enemy('Slime', 0), enemy('Goblin', 0), enemy('Boss', 100)]

    expect(getBossGuardedDamage(enemies[2], 64, enemies, true)).toBe(64)
  })

  it.each([3, 6])('Boss Battle %iはGUARD中でもminionを狙えるSkillを持つ', (battleId) => {
    const battle = battles.find((candidate) => candidate.id === battleId)
    expect(battle?.isBoss).toBe(true)
    if (!battle) throw new Error(`Missing battle ${battleId}`)

    const skills = getSkillCardsForBattle(battle, 'boss-guard-test')
    const hasMinionTarget = skills.some((skill) =>
      getTargets(battle.enemies, skill.rule).some((target) => target.name !== 'Boss'),
    )

    expect(hasMinionTarget).toBe(true)
  })
})
