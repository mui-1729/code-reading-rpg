import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  BOSS_GUARD_CONDITION_CODE,
  canPierceBossGuard,
  hasBossGuard,
  isBossGuardActive,
  resolveBossGuardDamage,
} from './bossGuard'
import { getSkillCardsForBattle } from './skills'
import { getTargets } from './targeting'

function battleById(id: number) {
  const battle = battles.find((candidate) => candidate.id === id)
  if (!battle) throw new Error(`Unknown battle: ${id}`)
  return battle
}

describe('Boss GUARD', () => {
  it('JS Boss表示名を変更してもstable roleでGUARDを維持する', () => {
    const battle = battleById(3)
    const renamed = battle.enemies.map((enemy) => ({ ...enemy, name: '翻訳された敵' }))
    const boss = renamed.find((enemy) => enemy.role === 'boss')!
    expect(isBossGuardActive(battle, renamed)).toBe(true)
    expect(resolveBossGuardDamage(battle, renamed, boss, 80)).toBe(1)
  })

  it('Battle 3 / 6だけにFinal Boss guard mechanicを付与する', () => {
    expect(hasBossGuard(battleById(3))).toBe(true)
    expect(hasBossGuard(battleById(6))).toBe(true)
    expect(hasBossGuard(battleById(1))).toBe(false)
    expect(hasBossGuard({ id: 3, isBoss: false })).toBe(false)
  })

  it('JSとTSで同じmechanicを使わないことをUI向け短文へ固定する', () => {
    expect(BOSS_GUARD_CONDITION_CODE).toBe(
      'JS GUARD // minion alive · TS CONTRACT // NARROW JUDGE / KEY INDEX pierces',
    )
  })

  it('JS Finalはminion生存中だけGUARD ACTIVEになる', () => {
    const battle = battleById(3)
    expect(isBossGuardActive(battle, battle.enemies)).toBe(true)

    const withoutMinions = battle.enemies.map((enemy) =>
      enemy.role === 'boss' ? { ...enemy } : { ...enemy, hp: 0 },
    )
    expect(isBossGuardActive(battle, withoutMinions)).toBe(false)
  })

  it('TS Finalはminion全滅後もContract Seal自体はBossへ残る', () => {
    const battle = battleById(6)
    const withoutMinions = battle.enemies.map((enemy) =>
      enemy.role === 'boss' ? { ...enemy } : { ...enemy, hp: 0 },
    )

    expect(isBossGuardActive(battle, battle.enemies)).toBe(true)
    expect(isBossGuardActive(battle, withoutMinions)).toBe(true)
  })

  it('JS FinalはGUARD中のBoss damageだけ1へ抑え、minion全滅後は通常damageを通す', () => {
    const battle = battleById(3)
    const boss = battle.enemies.find((enemy) => enemy.role === 'boss')
    const minion = battle.enemies.find((enemy) => enemy.role !== 'boss')
    if (!boss || !minion) throw new Error('Battle 3 needs Boss and minion')

    expect(resolveBossGuardDamage(battle, battle.enemies, boss, 80)).toBe(1)
    expect(resolveBossGuardDamage(battle, battle.enemies, minion, 80)).toBe(80)

    const openedEnemies = battle.enemies.map((enemy) =>
      enemy.role === 'boss' ? { ...enemy } : { ...enemy, hp: 0 },
    )
    expect(resolveBossGuardDamage(battle, openedEnemies, boss, 80)).toBe(80)
  })

  it('TS Finalは通常selectorを1 damageへ抑え、narrowing / keyof系ruleだけが貫通する', () => {
    const battle = battleById(6)
    const boss = battle.enemies.find((enemy) => enemy.role === 'boss')
    if (!boss) throw new Error('Battle 6 needs Boss')

    const ordinary = { rule: { kind: 'allAbove', hp: 65 } as const }
    const narrow = { rule: { kind: 'highestAttack' } as const }
    const keyof = { rule: { kind: 'lowestHp' } as const }

    expect(canPierceBossGuard(battle, ordinary)).toBe(false)
    expect(canPierceBossGuard(battle, narrow)).toBe(true)
    expect(canPierceBossGuard(battle, keyof)).toBe(true)
    expect(resolveBossGuardDamage(battle, battle.enemies, boss, 80, ordinary)).toBe(1)
    expect(resolveBossGuardDamage(battle, battle.enemies, boss, 80, narrow)).toBe(80)
    expect(resolveBossGuardDamage(battle, battle.enemies, boss, 80, keyof)).toBe(80)
  })

  it('通常Battleのdamageへ影響しない', () => {
    const battle = battleById(1)
    const target = battle.enemies[0]
    if (!target) throw new Error('Battle 1 needs an enemy')

    expect(resolveBossGuardDamage(battle, battle.enemies, target, 80)).toBe(80)
  })

  it('JS FinalはGUARD中でもminionを攻撃できるSkillを持つ', () => {
    const battle = battleById(3)
    const cards = getSkillCardsForBattle(battle, 'boss-guard-test:3')

    const canHitMinion = cards.some((skill) =>
      getTargets(battle.enemies, skill.rule).some(
        (target) =>
          target.role !== 'boss' &&
          resolveBossGuardDamage(battle, battle.enemies, target, 80, skill) === 80,
      ),
    )

    expect(canHitMinion).toBe(true)
  })

  it('TS Finalはsealed selectorとContractをpierceするselectorを両方持つ', () => {
    const battle = battleById(6)
    const cards = getSkillCardsForBattle(battle, 'boss-guard-test:6')

    expect(cards.some((skill) => canPierceBossGuard(battle, skill))).toBe(true)
    expect(cards.some((skill) => !canPierceBossGuard(battle, skill))).toBe(true)
  })
})
