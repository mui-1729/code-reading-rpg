import { describe, expect, it } from 'vitest'
import type { CombatStats } from '../rpg/combat'
import { resolveEnemyAttack, resolvePlayerAction } from './combatTurn'
import type { Battle, Enemy, SkillCard } from './types'

const stats: CombatStats = {
  level: 1,
  maxHp: 100,
  powerMultiplier: 1,
  attack: 0,
  defense: 6,
}

const enemy = (id: string, name: string, hp: number, attackDamage = 10): Enemy => ({
  id,
  name,
  hp,
  maxHp: hp,
  attackName: 'TEST',
  attackDamage,
  glyph: '•',
})

const battle: Battle = {
  id: 3,
  areaId: 'javascript',
  label: 'TEST',
  title: 'TEST',
  subtitle: 'TEST',
  recommendedLevel: 1,
  expReward: 0,
  goldReward: 0,
  isBoss: true,
  enemies: [],
  skillIds: [],
}

const skill: SkillCard = {
  id: 'test',
  name: 'TEST',
  code: 'fixture',
  power: 20,
  rule: { kind: 'allAbove', hp: 0 },
  concept: 'fixture',
  explanation: 'fixture',
}

describe('actual combat turn resolver', () => {
  it('Skill damage・BYTE follow-up・Boss Guardを同じtarget解決へ適用する', () => {
    const result = resolvePlayerAction({
      battle,
      enemies: [enemy('boss', 'Boss', 80), enemy('guard', 'Goblin', 20)],
      skill,
      playerStats: stats,
      partyFollowUpDamage: 7,
    })

    expect(result.targets.map((target) => target.id)).toEqual(['boss', 'guard'])
    expect(result.skillDamage).toBe(20)
    expect(result.damageByTargetId).toEqual({ boss: 1, guard: 27 })
    expect(result.enemies.map((target) => target.hp)).toEqual([79, 0])
    expect(result.guardedBossTargeted).toBe(true)
  })

  it('生存Enemyだけの攻撃へDefense mitigationを適用しpersistent HPの次値を返す', () => {
    const result = resolveEnemyAttack({
      enemies: [enemy('alive', 'Goblin', 10, 10), enemy('dead', 'Slime', 0, 99)],
      playerHp: 12,
      defense: stats.defense,
    })

    expect(result.attackers.map(({ enemy: attacker }) => attacker.id)).toEqual(['alive'])
    expect(result.attackers[0]?.damage).toBe(8)
    expect(result.totalDamage).toBe(8)
    expect(result.playerHp).toBe(4)
  })
})
