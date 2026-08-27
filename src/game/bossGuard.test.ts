import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  BOSS_GUARD_CONDITION_CODE,
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
  it('Battle 3 / 6だけにGUARDを付与する', () => {
    expect(hasBossGuard(battleById(3))).toBe(true)
    expect(hasBossGuard(battleById(6))).toBe(true)
    expect(hasBossGuard(battleById(1))).toBe(false)
    expect(hasBossGuard({ id: 3, isBoss: false })).toBe(false)
  })

  it('解除条件をBattle UIで読める短いcodeとして固定する', () => {
    expect(BOSS_GUARD_CONDITION_CODE).toBe(
      'enemies.some(e => e.name !== "Boss" && e.hp > 0)',
    )
  })

  it.each([3, 6])('Battle %iはminion生存中だけGUARD ACTIVEになる', (battleId) => {
    const battle = battleById(battleId)
    expect(isBossGuardActive(battle, battle.enemies)).toBe(true)

    const withoutMinions = battle.enemies.map((enemy) =>
      enemy.name === 'Boss' ? { ...enemy } : { ...enemy, hp: 0 },
    )
    expect(isBossGuardActive(battle, withoutMinions)).toBe(false)
  })

  it.each([3, 6])('Battle %iはGUARD中のBoss damageだけ1へ抑える', (battleId) => {
    const battle = battleById(battleId)
    const boss = battle.enemies.find((enemy) => enemy.name === 'Boss')
    const minion = battle.enemies.find((enemy) => enemy.name !== 'Boss')
    if (!boss || !minion) throw new Error(`Battle ${battleId} needs Boss and minion`)

    expect(resolveBossGuardDamage(battle, battle.enemies, boss, 80)).toBe(1)
    expect(resolveBossGuardDamage(battle, battle.enemies, minion, 80)).toBe(80)
  })

  it.each([3, 6])('Battle %iはminion全滅直後にBossへ通常damageを通す', (battleId) => {
    const battle = battleById(battleId)
    const boss = battle.enemies.find((enemy) => enemy.name === 'Boss')
    if (!boss) throw new Error(`Battle ${battleId} needs Boss`)

    const openedEnemies = battle.enemies.map((enemy) =>
      enemy.name === 'Boss' ? { ...enemy } : { ...enemy, hp: 0 },
    )
    expect(resolveBossGuardDamage(battle, openedEnemies, boss, 80)).toBe(80)
  })

  it('通常Battleのdamageへ影響しない', () => {
    const battle = battleById(1)
    const target = battle.enemies[0]
    if (!target) throw new Error('Battle 1 needs an enemy')

    expect(resolveBossGuardDamage(battle, battle.enemies, target, 80)).toBe(80)
  })

  it.each([3, 6])('Battle %iはGUARD中でもminionを攻撃できるSkillを持つ', (battleId) => {
    const battle = battleById(battleId)
    const cards = getSkillCardsForBattle(battle, `boss-guard-test:${battleId}`)

    const canHitMinion = cards.some((skill) =>
      getTargets(battle.enemies, skill.rule).some(
        (target) =>
          target.name !== 'Boss' &&
          resolveBossGuardDamage(battle, battle.enemies, target, 80) === 80,
      ),
    )

    expect(canHitMinion).toBe(true)
  })
})
