import { describe, expect, it } from 'vitest'
import { getBattlesForArea } from './areaProgression'
import { TYPESCRIPT_AREA_ID } from './areas'
import { getSkillCardsForBattle } from './skills'
import {
  typescriptSkillDefinitionById,
  typescriptSkillDefinitions,
} from './typescriptSkillDefinitions'

describe('TypeScript skill definitions', () => {
  it('Skill idが一意で4種類以上の型概念を扱う', () => {
    expect(new Set(typescriptSkillDefinitions.map((skill) => skill.id)).size).toBe(
      typescriptSkillDefinitions.length,
    )
    expect(new Set(typescriptSkillDefinitions.map((skill) => skill.concept)).size).toBeGreaterThanOrEqual(4)
  })

  it('TypeScript Areaの全Skill idにdefinitionが存在する', () => {
    for (const battle of getBattlesForArea(TYPESCRIPT_AREA_ID)) {
      for (const skillId of battle.skillIds) {
        expect(typescriptSkillDefinitionById[skillId], `${battle.id}:${skillId}`).toBeDefined()
      }
    }
  })

  it('Stage 5とBossは複数行variantをBattleへ出せる', () => {
    for (const battle of getBattlesForArea(TYPESCRIPT_AREA_ID).filter((candidate) => candidate.id >= 5)) {
      const cards = getSkillCardsForBattle(battle, `typescript-${battle.id}`)
      const multiLineIds = new Set(battle.multiLineSkillIds ?? [])

      for (const card of cards.filter((candidate) => multiLineIds.has(candidate.id))) {
        expect(card.code.split('\n').length).toBeGreaterThanOrEqual(3)
        expect(card.codeHelpLines?.length).toBe(card.code.split('\n').length)
      }
    }
  })

  it('Bossはnarrowing / keyofに加えてgeneric / Pickの発展variantを持つ', () => {
    const boss = getBattlesForArea(TYPESCRIPT_AREA_ID).find((battle) => battle.isBoss)
    if (!boss) throw new Error('TypeScript Boss was not found')

    expect(boss.skillIds).toContain('ts-narrow')
    expect(boss.skillIds).toContain('ts-keyof')

    const narrowVariants = typescriptSkillDefinitionById['ts-narrow'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )
    const keyofVariants = typescriptSkillDefinitionById['ts-keyof'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )

    expect(narrowVariants.some((variant) => variant.code.includes('candidate is'))).toBe(true)
    expect(narrowVariants.some((variant) => variant.code.includes('type Scored<T>'))).toBe(true)
    expect(narrowVariants.some((variant) => variant.code.includes('Scored<Enemy>'))).toBe(true)
    expect(keyofVariants.some((variant) => variant.code.includes('keyof Enemy'))).toBe(true)
    expect(keyofVariants.some((variant) => variant.code.includes('Pick<Enemy, "hp">'))).toBe(true)
  })

  it('発展variantでも行別CODE HELP数が物理行数と一致する', () => {
    for (const skillId of ['ts-narrow', 'ts-keyof']) {
      const variants = typescriptSkillDefinitionById[skillId].codeVariants.filter(
        (variant) => variant.lineMode === 'multi',
      )

      for (const variant of variants) {
        expect(variant.codeHelpLines).toHaveLength(variant.code.split('\n').length)
        expect(variant.codeHelpLines?.every((line) => line.trim().length > 0)).toBe(true)
      }
    }
  })

  it('generic / Pickの発展variantはBoss専用Skillにだけ追加する', () => {
    const nonBossBattles = getBattlesForArea(TYPESCRIPT_AREA_ID).filter((battle) => !battle.isBoss)
    const nonBossSkillIds = new Set(nonBossBattles.flatMap((battle) => battle.skillIds))

    expect(nonBossSkillIds.has('ts-narrow')).toBe(false)
    expect(nonBossSkillIds.has('ts-keyof')).toBe(false)
  })
})
