import { describe, expect, it } from 'vitest'
import { forestSkillDefinitions } from './forestSkillDefinitions'
import { allSkillDefinitionById, skills } from './skills'

describe('forest skill definitions', () => {
  it('LINKはfind() + &&だけで既習property条件を組み合わせる', () => {
    const link = allSkillDefinitionById.link

    expect(link).toBeDefined()
    expect(link.rule).toEqual({ kind: 'named', name: 'Goblin' })
    expect(link.concept).toBe('find() + &&')
    expect(link.codeVariants.every((variant) => variant.code.includes('find('))).toBe(true)
    expect(link.codeVariants.every((variant) => variant.code.includes('&&'))).toBe(true)
    expect(link.codeVariants.every((variant) => !variant.code.includes('filter('))).toBe(true)
    expect(skills.link.rule).toEqual(link.rule)
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
