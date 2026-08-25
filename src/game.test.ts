import { describe, expect, it } from 'vitest'
import { battles, getTargets, type Enemy, type TargetRule } from './game'

const enemy = (id: string, name: string, hp: number): Enemy => ({
  id,
  name,
  hp,
  maxHp: Math.max(hp, 1),
  attackName: 'Test Attack',
  attackDamage: 1,
  glyph: '•',
})

const targetIds = (enemies: Enemy[], rule: TargetRule) =>
  getTargets(enemies, rule).map((target) => target.id)

describe('getTargets', () => {
  const enemies = [
    enemy('a', 'Slime', 40),
    enemy('b', 'Goblin', 70),
    enemy('c', 'Goblin', 30),
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

  it('HPが0以下の敵を対象に含めない', () => {
    const withDefeated = [enemy('dead', 'Goblin', 0), ...enemies]

    expect(targetIds(withDefeated, { kind: 'named', name: 'Goblin' })).toEqual(['b'])
    expect(targetIds(withDefeated, { kind: 'lowestHp' })).toEqual(['c'])
  })

  it('対象が存在しない場合は空配列を返す', () => {
    expect(targetIds(enemies, { kind: 'firstBelow', hp: 10 })).toEqual([])
    expect(targetIds(enemies, { kind: 'named', name: 'Boss' })).toEqual([])
  })
})

describe('battle skill progression', () => {
  it('Battle 1→2→3で利用可能Skillが3→4→5枚と累積する', () => {
    expect(battles.map((battle) => battle.skillIds.length)).toEqual([3, 4, 5])
    expect(battles[1].skillIds).toEqual(expect.arrayContaining(battles[0].skillIds))
    expect(battles[2].skillIds).toEqual(expect.arrayContaining(battles[1].skillIds))
  })
})
