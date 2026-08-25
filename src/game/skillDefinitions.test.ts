import { describe, expect, it } from 'vitest'
import { skillDefinitionById, skillDefinitions } from './skillDefinitions'
import { skills } from './skills'

describe('skill definitions', () => {
  it('Skill IDが重複しない', () => {
    expect(new Set(skillDefinitions.map((definition) => definition.id)).size).toBe(
      skillDefinitions.length,
    )
  })

  it('全Skillが少なくとも1つのコードvariantを持つ', () => {
    expect(skillDefinitions.every((definition) => definition.codeVariants.length > 0)).toBe(true)
  })

  it('skillsは定義の標準variantと同じruleから生成される', () => {
    for (const definition of skillDefinitions) {
      const skill = skills[definition.id]
      expect(skill).toBeDefined()
      expect(skill.code).toBe(definition.codeVariants[0].code)
      expect(skill.rule).toEqual(definition.rule)
      expect(skill.power).toBe(definition.power)
      expect(skillDefinitionById[definition.id]).toBe(definition)
    }
  })

  it('MVPのSkill内容を維持する', () => {
    expect({
      trace: [skills.trace.code, skills.trace.power, skills.trace.rule],
      pulse: [skills.pulse.code, skills.pulse.power, skills.pulse.rule],
      nova: [skills.nova.code, skills.nova.power, skills.nova.rule],
      viper: [skills.viper.code, skills.viper.power, skills.viper.rule],
      echo: [skills.echo.code, skills.echo.power, skills.echo.rule],
      moonEdge: [skills['moon-edge'].code, skills['moon-edge'].power, skills['moon-edge'].rule],
    }).toEqual({
      trace: ['enemies.find(e => e.hp < 45)', 34, { kind: 'firstBelow', hp: 45 }],
      pulse: ['enemies.find(e => e.name === "Goblin")', 48, { kind: 'named', name: 'Goblin' }],
      nova: ['enemies.find(e => e.hp > 60)', 62, { kind: 'firstAbove', hp: 60 }],
      viper: ['enemies.filter(e => e.hp < 55)', 22, { kind: 'allBelow', hp: 55 }],
      echo: ['enemies.filter(e => e.hp > 65)', 26, { kind: 'allAbove', hp: 65 }],
      moonEdge: [
        '[...enemies].sort((a, b) => a.hp - b.hp)[0]',
        72,
        { kind: 'lowestHp' },
      ],
    })
  })
})
