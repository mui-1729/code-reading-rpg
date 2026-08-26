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
    const first = getSkillCardForBattle('trace', 1, 'repeatable-seed')
    const second = getSkillCardForBattle('trace', 1, 'repeatable-seed')

    expect(second.code).toBe(first.code)
  })

  it('seedが変わると複数variantが選ばれる', () => {
    const selectedCodes = new Set(
      Array.from({ length: 32 }, (_, index) =>
        getSkillCardForBattle('trace', 1, `variant-seed-${index}`).code,
      ),
    )

    expect(selectedCodes.size).toBeGreaterThan(1)
  })

  it('variant選択でPOWER・TargetRule・concept・explanationを変えない', () => {
    for (const battle of battles) {
      for (const skillId of battle.skillIds) {
        const defaultSkill = skills[skillId]
        const variantSkill = getSkillCardForBattle(skillId, battle.id, 'preserve-domain')

        expect(variantSkill.power).toBe(defaultSkill.power)
        expect(variantSkill.rule).toEqual(defaultSkill.rule)
        expect(variantSkill.concept).toBe(defaultSkill.concept)
        expect(variantSkill.explanation).toBe(defaultSkill.explanation)
      }
    }
  })

  it('variantが変わっても生成盤面の対象判定を変えない', () => {
    for (const battle of battles) {
      const generated = generateBattle(battle.id, 'target-stability')
      expect(generated).toBeDefined()
      if (!generated) continue

      for (const skillId of generated.skillIds) {
        const defaultTargets = getTargets(generated.enemies, skills[skillId].rule).map(
          (enemy) => enemy.id,
        )
        const variantTargets = getTargets(
          generated.enemies,
          getSkillCardForBattle(skillId, battle.id, 'target-stability').rule,
        ).map((enemy) => enemy.id)

        expect(variantTargets).toEqual(defaultTargets)
      }
    }
  })
})
