import { describe, expect, it } from 'vitest'
import { battles, getTargets, type Enemy, type TargetRule } from './game'

const enemy = (id: string, name: string, hp: number, attackDamage = 1): Enemy => ({
  id,
  name,
  hp,
  maxHp: Math.max(hp, 1),
  attackName: 'Test Attack',
  attackDamage,
  glyph: '•',
})

const targetIds = (enemies: Enemy[], rule: TargetRule) =>
  getTargets(enemies, rule).map((target) => target.id)

describe('getTargets', () => {
  const enemies = [
    enemy('a', 'Slime', 40, 5),
    enemy('b', 'Goblin', 70, 15),
    enemy('c', 'Goblin', 30, 9),
  ]

  it('firstBelowは条件に一致した最初の生存敵1体を返す', () => {
    expect(targetIds(enemies, { kind: 'firstBelow', hp: 50 })).toEqual(['a'])
  })

  it('allBelowは条件に一致した生存敵全員を返す', () => {
    expect(targetIds(enemies, { kind: 'allBelow', hp: 50 })).toEqual(['a', 'c'])
  })

  it('firstAboveは条件に一致した最初の生存敵1体を返す', () => {
    expect(targetIds(enemies, { kind: 'firstAbove', hp: 50 })).toEqual(['b'])
  })

  it('allAboveは条件に一致した生存敵全員を返す', () => {
    expect(targetIds(enemies, { kind: 'allAbove', hp: 35 })).toEqual(['a', 'b'])
  })

  it('namedは指定名の最初の生存敵を返す', () => {
    expect(targetIds(enemies, { kind: 'named', name: 'Goblin' })).toEqual(['b'])
  })

  it('lowestHpはHPが最も低い生存敵を返す', () => {
    expect(targetIds(enemies, { kind: 'lowestHp' })).toEqual(['c'])
  })

  it('&&相当ruleは両条件に一致した生存敵だけを返す', () => {
    expect(
      targetIds(enemies, { kind: 'allBelowAndAttackAtLeast', hp: 50, attackDamage: 8 }),
    ).toEqual(['c'])
  })

  it('||相当ruleはどちらかの条件に一致した最初の生存敵を返す', () => {
    expect(
      targetIds(enemies, { kind: 'firstAttackAtLeastOrAbove', hp: 100, attackDamage: 14 }),
    ).toEqual(['b'])
  })

  it('some()相当ruleは条件に合う敵が1体でもいれば生存敵全員を返す', () => {
    expect(targetIds(enemies, { kind: 'allIfAnyBelow', hp: 35 })).toEqual(['a', 'b', 'c'])
    expect(targetIds(enemies, { kind: 'allIfAnyBelow', hp: 20 })).toEqual([])
  })

  it('reduce()相当ruleは攻撃力が最も高い生存敵を返す', () => {
    expect(targetIds(enemies, { kind: 'highestAttack' })).toEqual(['b'])
  })

  it('HPが0以下の敵を対象に含めない', () => {
    const withDefeated = [enemy('dead', 'Goblin', 0, 99), ...enemies]

    expect(targetIds(withDefeated, { kind: 'named', name: 'Goblin' })).toEqual(['b'])
    expect(targetIds(withDefeated, { kind: 'lowestHp' })).toEqual(['c'])
    expect(targetIds(withDefeated, { kind: 'highestAttack' })).toEqual(['b'])
  })

  it('対象が存在しない場合は空配列を返す', () => {
    expect(targetIds(enemies, { kind: 'firstBelow', hp: 10 })).toEqual([])
    expect(targetIds(enemies, { kind: 'named', name: 'Boss' })).toEqual([])
    expect(targetIds([enemy('dead', 'Boss', 0, 99)], { kind: 'highestAttack' })).toEqual([])
  })
})

describe('battle skill progression', () => {
  it('Battle 1→2→3で既習Skillを維持しつつ新構文Skillが累積する', () => {
    expect(battles.map((battle) => battle.skillIds.length)).toEqual([3, 6, 9])
    expect(battles[1].skillIds).toEqual(expect.arrayContaining(battles[0].skillIds))
    expect(battles[2].skillIds).toEqual(expect.arrayContaining(battles[1].skillIds))
    expect(battles[1].skillIds).toEqual(expect.arrayContaining(['lock', 'alert']))
    expect(battles[2].skillIds).toEqual(expect.arrayContaining(['sweep', 'judge']))
  })
})
