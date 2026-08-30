import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { allSkillDefinitionById, getSkillCardForBattle, skills } from './skills'
import { getTargets } from './targeting'

describe('seeded skill code variants', () => {
  it('現在Battleで使う全Skillが複数の1行variantを持つ', () => {
    const usedSkillIds = new Set(battles.flatMap((battle) => battle.skillIds))

    for (const skillId of usedSkillIds) {
      const variants = allSkillDefinitionById[skillId].codeVariants
      const singleLineVariants = variants.filter((variant) => variant.lineMode === 'single')

      expect(singleLineVariants.length).toBeGreaterThanOrEqual(2)
      expect(singleLineVariants.every((variant) => !variant.code.includes('\n'))).toBe(true)
      expect(new Set(variants.map((variant) => variant.code)).size).toBe(variants.length)
    }
  })

  it('battleId + seed + skillIdが同じなら同じvariantを再現する', () => {
    const first = getSkillCardForBattle('pulse', 1, 'repeatable-seed')
    const second = getSkillCardForBattle('pulse', 1, 'repeatable-seed')

    expect(second).toEqual(first)
  })

  it('seedが変わると同じSkill名でも複数TargetRuleが選ばれる', () => {
    const cards = Array.from({ length: 64 }, (_, index) =>
      getSkillCardForBattle('pulse', 1, `variant-seed-${index}`),
    )
    const rules = new Set(cards.map((card) => JSON.stringify(card.rule)))
    const targetSets = new Set(
      cards.map((card) =>
        getTargets(battles[0].enemies, card.rule)
          .map((enemy) => enemy.name)
          .join(','),
      ),
    )

    expect(new Set(cards.map((card) => card.name))).toEqual(new Set(['PULSE']))
    expect(rules.size).toBeGreaterThan(1)
    expect(targetSets.size).toBeGreaterThan(1)
  })

  it('semantic variantでもPOWERはSkill固有値を維持する', () => {
    for (const battle of battles) {
      for (const skillId of battle.skillIds) {
        const defaultSkill = skills[skillId]
        const variantSkill = getSkillCardForBattle(skillId, battle.id, 'preserve-power',
          battle.multiLineSkillIds?.includes(skillId) ? 'multi' : 'single')

        expect(variantSkill.power).toBe(defaultSkill.power)
        expect(variantSkill.concept.trim().length).toBeGreaterThan(0)
        expect(variantSkill.explanation.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('生成盤面でも選択されたsemantic ruleに初期targetがあるSkillを維持する', () => {
    for (const battle of battles) {
      const seed = `target-valid-${battle.id}`
      const generated = generateBattle(battle.id, seed)
      expect(generated).toBeDefined()
      if (!generated) continue

      const cards = generated.skillIds.map((skillId) =>
        getSkillCardForBattle(
          skillId,
          battle.id,
          seed,
          generated.multiLineSkillIds?.includes(skillId) ? 'multi' : 'single',
        ),
      )

      expect(cards.some((card) => getTargets(generated.enemies, card.rule).length > 0)).toBe(true)
    }
  })
})
