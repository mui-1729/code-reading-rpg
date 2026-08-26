import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { skillDefinitionById } from './skillDefinitions'
import { getSkillCardsForBattle, skills } from './skills'

describe('Battle 3 multiline code', () => {
  it('Battle 1とBattle 2は1行コードだけを表示する', () => {
    for (const battleId of [1, 2]) {
      const battle = generateBattle(battleId, 'single-line-only')
      expect(battle).toBeDefined()
      if (!battle) continue

      const cards = getSkillCardsForBattle(battle, 'single-line-only')
      expect(cards.every((card) => !card.code.includes('\n'))).toBe(true)
    }
  })

  it('Battle 3はsort / some / reduceを複数行で表示する', () => {
    for (let index = 0; index < 24; index += 1) {
      const seed = `multi-${index}`
      const battle = generateBattle(3, seed)
      expect(battle).toBeDefined()
      if (!battle) continue

      const cards = getSkillCardsForBattle(battle, seed)
      const multiLineIds = cards.filter((card) => card.code.includes('\n')).map((card) => card.id)

      expect(multiLineIds).toEqual(expect.arrayContaining(['moon-edge', 'sweep', 'judge']))
    }
  })

  it('Battle 3の複数行指定Skillにはmulti variantが定義されている', () => {
    const battle = battles.find((candidate) => candidate.id === 3)
    expect(battle).toBeDefined()
    if (!battle) return

    expect(battle.multiLineSkillIds).toEqual(expect.arrayContaining(['moon-edge', 'sweep', 'judge']))
    for (const skillId of battle.multiLineSkillIds ?? []) {
      expect(battle.skillIds).toContain(skillId)
      const multiVariants = skillDefinitionById[skillId].codeVariants.filter(
        (variant) => variant.lineMode === 'multi',
      )
      expect(multiVariants.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('同じseedなら同じ複数行variantを再現する', () => {
    const battle = generateBattle(3, 'same-multi-seed')
    expect(battle).toBeDefined()
    if (!battle) return

    const first = getSkillCardsForBattle(battle, 'same-multi-seed')
    const second = getSkillCardsForBattle(battle, 'same-multi-seed')

    expect(second.map((card) => card.code)).toEqual(first.map((card) => card.code))
  })

  it('複数行化してもPOWER・TargetRule・concept・explanationを変えない', () => {
    const battle = generateBattle(3, 'domain-stability')
    expect(battle).toBeDefined()
    if (!battle) return

    const cards = getSkillCardsForBattle(battle, 'domain-stability')
    for (const card of cards) {
      const defaultSkill = skills[card.id]
      expect(card.power).toBe(defaultSkill.power)
      expect(card.rule).toEqual(defaultSkill.rule)
      expect(card.concept).toBe(defaultSkill.concept)
      expect(card.explanation).toBe(defaultSkill.explanation)
    }
  })

  it('複数行variantは改行をコード文字列として保持する', () => {
    for (const skillId of ['moon-edge', 'sweep', 'judge']) {
      const multiVariants = skillDefinitionById[skillId].codeVariants.filter(
        (variant) => variant.lineMode === 'multi',
      )

      expect(multiVariants.length).toBeGreaterThanOrEqual(2)
      expect(multiVariants.every((variant) => variant.code.split('\n').length === 2)).toBe(true)
    }
  })
})
