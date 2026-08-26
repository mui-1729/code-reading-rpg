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

  it('追加構文Skillがcodeと対応するTargetRuleを持つ', () => {
    expect({
      lock: [skills.lock.code, skills.lock.rule, skills.lock.concept],
      alert: [skills.alert.code, skills.alert.rule, skills.alert.concept],
      sweep: [skills.sweep.code, skills.sweep.rule, skills.sweep.concept],
      judge: [skills.judge.code, skills.judge.rule, skills.judge.concept],
    }).toEqual({
      lock: [
        'enemies.filter(e => e.hp > 0 && e.hp < 100 && e.attackDamage >= 8)',
        { kind: 'allBelowAndAttackAtLeast', hp: 100, attackDamage: 8 },
        '&&',
      ],
      alert: [
        'enemies.find(e => e.hp > 0 && (e.attackDamage >= 14 || e.hp > 120))',
        { kind: 'firstAttackAtLeastOrAbove', hp: 120, attackDamage: 14 },
        '||',
      ],
      sweep: [
        'enemies.some(e => e.hp > 0 && e.hp < 50) ? enemies.filter(e => e.hp > 0) : []',
        { kind: 'allIfAnyBelow', hp: 50 },
        'filter() + some() + ? :',
      ],
      judge: [
        'enemies.filter(e => e.hp > 0).reduce((best, e) => e.attackDamage > best.attackDamage ? e : best)',
        { kind: 'highestAttack' },
        'filter() + map() + reduce()',
      ],
    })
  })

  it('追加構文Skillは暗記回避用に複数code variantを持つ', () => {
    for (const skillId of ['lock', 'alert', 'sweep', 'judge']) {
      const definition = skillDefinitionById[skillId]
      expect(definition.codeVariants.length).toBeGreaterThanOrEqual(3)
      expect(new Set(definition.codeVariants.map((variant) => variant.code)).size).toBe(
        definition.codeVariants.length,
      )
    }
  })

  it('複合code variantの行別HELPは物理行数と一致する', () => {
    for (const skillId of ['moon-edge', 'sweep', 'judge']) {
      const definition = skillDefinitionById[skillId]
      const multiVariants = definition.codeVariants.filter((variant) => variant.lineMode === 'multi')

      for (const variant of multiVariants) {
        expect(variant.codeHelpLines).toHaveLength(variant.code.split('\n').length)
      }
    }
  })
})
