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

const enemy = (id: string, name: string, hp: number, attackDamage = 10, role: Enemy['role'] = 'standard'): Enemy => ({
  id,
  name,
  role,
  visualId: 'enemy-fallback',
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
      enemies: [enemy('boss', 'Boss', 80, 10, 'boss'), enemy('guard', 'Goblin', 20)],
      skill,
      playerStats: stats,
      partyFollowUpDamage: 7,
    })

    expect(result.targets.map((target) => target.id)).toEqual(['boss', 'guard'])
    expect(result.skillDamage).toBe(20)
    expect(result.damageByTargetId).toEqual({ boss: 8, guard: 20 })
    expect(result.enemies.map((target) => target.hp)).toEqual([72, 0])
    expect(result.partyFollowUpTargetId).toBe('boss')
    expect(result.partyFollowUpDamage).toBe(7)
    expect(result.guardedBossTargeted).toBe(true)
  })

  it('multi-target Skillの追撃は選択target群の生存先頭1体にだけ発生する', () => {
    const result = resolvePlayerAction({
      battle: { ...battle, isBoss: false },
      enemies: [enemy('first', 'Slime', 50), enemy('second', 'Goblin', 50)],
      skill,
      playerStats: stats,
      partyFollowUpDamage: 7,
    })

    expect(result.damageByTargetId).toEqual({ first: 27, second: 20 })
    expect(result.partyFollowUpTargetId).toBe('first')
    expect(result.totalDamage).toBe(47)
  })

  it('Skillで倒した相手を除き、選択していない相手へ追撃しない', () => {
    const result = resolvePlayerAction({
      battle: { ...battle, isBoss: false },
      enemies: [enemy('defeated', 'Slime', 20), enemy('selected', 'Goblin', 40), enemy('outside', 'Dragon', 80)],
      skill: { ...skill, rule: { kind: 'allBelow', hp: 50 } },
      playerStats: stats,
      partyFollowUpDamage: 7,
    })

    expect(result.partyFollowUpTargetId).toBe('selected')
    expect(result.damageByTargetId).toEqual({ defeated: 20, selected: 27 })
    expect(result.enemies.find((target) => target.id === 'outside')?.hp).toBe(80)
  })

  it('選択targetが全滅した場合に追撃ログ用のfalse hitを生成しない', () => {
    const result = resolvePlayerAction({
      battle: { ...battle, isBoss: false },
      enemies: [enemy('defeated', 'Slime', 20)],
      skill,
      playerStats: stats,
      partyFollowUpDamage: 7,
    })

    expect(result.partyFollowUpTargetId).toBeNull()
    expect(result.partyFollowUpDamage).toBe(0)
    expect(result.damageByTargetId).toEqual({ defeated: 20 })
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
