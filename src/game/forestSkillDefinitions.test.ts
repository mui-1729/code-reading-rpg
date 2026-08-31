import { describe, expect, it } from 'vitest'
import { forestSkillDefinitions } from './forestSkillDefinitions'
import { allSkillDefinitionById, skills } from './skills'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (id: string, name: string, hp: number): Enemy => ({
  id,
  name,
  role: 'standard',
  visualId: 'enemy-fallback',
  hp,
  maxHp: Math.max(hp, 1),
  attackName: 'Test Attack',
  attackDamage: 1,
  glyph: '•',
})

describe('forest skill definitions', () => {
  it('LINKはfind() + &&でHPとnameの両条件を読む', () => {
    const link = allSkillDefinitionById.link

    expect(link).toBeDefined()
    expect(link.rule).toEqual({ kind: 'firstAboveAndNamed', hp: 50, name: 'Goblin' })
    expect(link.concept).toBe('find() + &&')
    expect(link.codeVariants.every((variant) => variant.code.includes('find('))).toBe(true)
    expect(link.codeVariants.every((variant) => variant.code.includes('&&'))).toBe(true)
    expect(link.codeVariants.every((variant) => variant.code.includes('> 50'))).toBe(true)
    expect(link.codeVariants.every((variant) => variant.code.includes('=== "Goblin"'))).toBe(true)
    expect(link.codeVariants.every((variant) => !variant.code.includes('filter('))).toBe(true)
    expect(skills.link.rule).toEqual(link.rule)

    const targets = getTargets(
      [
        enemy('low-goblin', 'Goblin', 42),
        enemy('high-slime', 'Slime', 80),
        enemy('high-goblin', 'Goblin', 64),
      ],
      link.rule,
    )
    expect(targets.map((target) => target.id)).toEqual(['high-goblin'])
  })

  it('FORKはfind()の内側で||を読み、filter()を先取りしない', () => {
    const fork = allSkillDefinitionById.fork

    expect(fork).toBeDefined()
    expect(fork.rule).toEqual({ kind: 'firstBelowOrAbove', below: 40, above: 80 })
    expect(fork.concept).toBe('find() + ||')
    expect(fork.codeVariants.every((variant) => variant.code.includes('||'))).toBe(true)
    expect(fork.codeVariants.every((variant) => !variant.code.includes('filter('))).toBe(true)
  })

  it('Forest Skill IDとcode variantは重複しない', () => {
    expect(new Set(forestSkillDefinitions.map((definition) => definition.id)).size).toBe(
      forestSkillDefinitions.length,
    )

    for (const definition of forestSkillDefinitions) {
      expect(definition.codeVariants.length).toBeGreaterThanOrEqual(3)
      expect(new Set(definition.codeVariants.map((variant) => variant.code)).size).toBe(
        definition.codeVariants.length,
      )
    }
  })
})
