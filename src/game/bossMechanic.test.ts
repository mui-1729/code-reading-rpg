import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  BOSS_GUARD_CODE,
  isBossGuardActive,
  resolveBossGuardDamage,
} from './bossMechanic'
import { getSkillCardsForBattle } from './skills'
import { getTargets } from './targeting'

describe('Boss GUARD', () => {
  const jsBoss = battles.find((battle) => battle.id === 3)
  const normalBattle = battles.find((battle) => battle.id === 1)

  if (!jsBoss || !normalBattle) throw new Error('Expected battle fixtures')

  it('Boss Battleだけminion生存中にACTIVEになる', () => {
    expect(isBossGuardActive(jsBoss, jsBoss.enemies)).toBe(true)
    expect(isBossGuardActive(normalBattle, normalBattle.enemies)).toBe(false)

    const bossOnly = jsBoss.enemies.map((enemy) =>
      enemy.name === 'Boss' ? enemy : { ...enemy, hp: 0 },
    )
    expect(isBossGuardActive(jsBoss, bossOnly)).toBe(false)
  })

  it('ACTIVE中のBoss damageだけ1へ抑え、minion damageは変えない', () => {
    const boss = jsBoss.enemies.find((enemy) => enemy.name === 'Boss')
    const minion = jsBoss.enemies.find((enemy) => enemy.name !== 'Boss')
    if (!boss || !minion) throw new Error('Expected Boss and minion')

    expect(resolveBossGuardDamage(jsBoss, jsBoss.enemies, boss, 80)).toEqual({
      guarded: true,
      damage: 1,
    })
    expect(resolveBossGuardDamage(jsBoss, jsBoss.enemies, minion, 80)).toEqual({
      guarded: false,
      damage: 80,
    })
  })

  it('minion全滅後はBossへfull damageを通す', () => {
    const bossOnly = jsBoss.enemies.map((enemy) =>
      enemy.name === 'Boss' ? enemy : { ...enemy, hp: 0 },
    )
    const boss = bossOnly.find((enemy) => enemy.name === 'Boss')
    if (!boss) throw new Error('Expected Boss')

    expect(resolveBossGuardDamage(jsBoss, bossOnly, boss, 80)).toEqual({
      guarded: false,
      damage: 80,
    })
  })

  it.each([3, 6])('Battle %sはGUARD中でもminionへ届くSkillを持つ', (battleId) => {
    const battle = battles.find((candidate) => candidate.id === battleId)
    if (!battle) throw new Error(`Expected Battle ${battleId}`)

    const cards = getSkillCardsForBattle(battle, `boss-guard:${battleId}`)
    const canHitMinion = cards.some((card) =>
      getTargets(battle.enemies, card.rule).some((target) => target.name !== 'Boss'),
    )

    expect(BOSS_GUARD_CODE).toContain('some')
    expect(canHitMinion).toBe(true)
  })
})
