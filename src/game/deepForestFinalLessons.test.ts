import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { deepForestSkillDefinitions } from './deepForestSkillDefinitions'
import { generateBattle } from './generator'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (
  id: string,
  name: string,
  hp: number,
  attackDamage: number,
): Enemy => ({
  id,
  name,
  hp,
  maxHp: hp,
  attackName: 'Test',
  attackDamage,
  glyph: '●',
})

describe('JavaScript Deep Forest final lessons', () => {
  it('Battle 16〜22を順番に定義し、Battle 19だけはArea Boss扱いにしない', () => {
    const finalLessons = battles.filter((battle) => battle.id >= 16 && battle.id <= 22)

    expect(finalLessons.map((battle) => battle.id)).toEqual([16, 17, 18, 19, 20, 21, 22])
    expect(finalLessons.find((battle) => battle.id === 19)?.isBoss).not.toBe(true)
    expect(finalLessons.find((battle) => battle.id === 20)?.multiLineSkillIds).toContain('order')
    expect(finalLessons.find((battle) => battle.id === 21)?.multiLineSkillIds).toEqual(
      expect.arrayContaining(['safe-path', 'order']),
    )
    expect(finalLessons.find((battle) => battle.id === 22)?.multiLineSkillIds).toEqual(
      expect.arrayContaining(['reduce-focus', 'safe-path', 'order']),
    )
  })

  it('map / some / every / sort / optional / reduceを別Skillとして段階導入する', () => {
    const byId = Object.fromEntries(deepForestSkillDefinitions.map((skill) => [skill.id, skill]))

    expect(byId.project?.concept).toContain('map()')
    expect(byId.project?.codeVariants[0]?.code).toContain('.map(')
    expect(byId.project?.codeVariants[0]?.code).toContain('.find(')
    expect(byId.signal?.rule).toEqual({ kind: 'allIfAnyBelow', hp: 50 })
    expect(byId.signal?.codeVariants[0]?.code).toContain('.some(')
    expect(byId.sync?.rule).toEqual({ kind: 'allIfEveryBelow', hp: 100 })
    expect(byId.sync?.codeVariants[0]?.code).toContain('.every(')
    expect(byId.order?.rule).toEqual({ kind: 'lowestHp' })
    expect(byId.order?.codeVariants[0]?.code).toContain('.sort(')
    expect(byId.order?.codeVariants[0]?.code).toContain('ordered[0]')
    expect(byId['safe-path']?.codeVariants[0]?.code).toContain('?.hp')
    expect(byId['safe-path']?.codeVariants[0]?.code).toContain('?? Infinity')
    expect(byId['reduce-focus']?.rule).toEqual({ kind: 'highestAttack' })
    expect(byId['reduce-focus']?.codeVariants[0]?.code).toContain('.reduce(')
  })

  it('every相当ruleは生存Enemy全員が条件を満たす時だけ全員を返す', () => {
    const enemies = [
      enemy('a', 'Slime', 30, 3),
      enemy('b', 'Goblin', 70, 7),
      enemy('c', 'Guardian', 95, 10),
    ]

    expect(getTargets(enemies, { kind: 'allIfEveryBelow', hp: 100 }).map((item) => item.id)).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(getTargets(enemies, { kind: 'allIfEveryBelow', hp: 90 })).toEqual([])
  })

  it('every相当ruleは撃破済みEnemyを判定対象から除外する', () => {
    const enemies = [
      enemy('a', 'Slime', 40, 3),
      { ...enemy('dead', 'Guardian', 120, 10), hp: 0 },
      enemy('b', 'Goblin', 80, 7),
    ]

    expect(getTargets(enemies, { kind: 'allIfEveryBelow', hp: 100 }).map((item) => item.id)).toEqual([
      'a',
      'b',
    ])
  })

  it.each([16, 17, 18, 19, 20, 21, 22])('Battle %iをseed付きでsolvableに生成できる', (battleId) => {
    const generated = generateBattle(battleId, `deep-final:${battleId}`)

    expect(generated?.id).toBe(battleId)
    expect(generated?.enemies.length).toBeGreaterThan(0)
    expect(generated?.skillIds.length).toBeGreaterThan(0)
  })
})
