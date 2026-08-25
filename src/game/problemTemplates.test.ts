import { describe, expect, it } from 'vitest'
import { problemTemplates, problemTemplateBySkillId } from './problemTemplates'
import { skills } from './skills'

describe('problem templates', () => {
  it('templateIdとSkill IDが重複しない', () => {
    expect(new Set(problemTemplates.map((template) => template.templateId)).size).toBe(
      problemTemplates.length,
    )
    expect(new Set(problemTemplates.map((template) => template.id)).size).toBe(
      problemTemplates.length,
    )
  })

  it('全テンプレートが少なくとも1つのコードvariantを持つ', () => {
    expect(problemTemplates.every((template) => template.codeVariants.length > 0)).toBe(true)
  })

  it('skillsはテンプレートの標準variantと同じruleから生成される', () => {
    for (const template of problemTemplates) {
      const skill = skills[template.id]
      expect(skill).toBeDefined()
      expect(skill.code).toBe(template.codeVariants[0].code)
      expect(skill.rule).toEqual(template.rule)
      expect(skill.power).toBe(template.power)
      expect(problemTemplateBySkillId[template.id]).toBe(template)
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
