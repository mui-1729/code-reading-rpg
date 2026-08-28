import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { isBattleSolvable } from './solvability'
import { skills } from './skills'

describe('JavaScript Deep Forest filter lesson', () => {
  const lesson = battles.find((battle) => battle.id === 15)

  it('Battle 15はfilter()の>条件を既存ECHOで反復する', () => {
    expect(lesson).toBeDefined()
    expect(lesson?.skillIds).toEqual(['gather', 'echo', 'nova'])
    expect(lesson?.unlockSkillId).toBe('echo')
    expect(lesson?.isBoss).not.toBe(true)

    expect(skills.echo.code).toContain('filter')
    expect(skills.echo.code).toContain('hp > 65')
    expect(skills.echo.rule).toEqual({ kind: 'allAbove', hp: 65 })
  })

  it('base battleとseeded variantが解ける', () => {
    expect(lesson && isBattleSolvable(lesson)).toBe(true)

    for (const seed of ['deep-filter-a', 'deep-filter-b', 'deep-filter-c']) {
      const generated = generateBattle(15, seed)
      expect(generated).toBeDefined()
      expect(generated && isBattleSolvable(generated)).toBe(true)
    }
  })
})
