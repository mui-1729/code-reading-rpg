import { describe, expect, it } from 'vitest'
import { getBattlesForArea } from './areaProgression'
import { TYPESCRIPT_AREA_ID } from './areas'
import { getSkillCardsForBattle } from './skills'
import { typescriptSkillDefinitionById, typescriptSkillDefinitions } from './typescriptSkillDefinitions'

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

  it('Bossはnarrowingとkeyofを含む複合読解にする', () => {
    const boss = getBattlesForArea(TYPESCRIPT_AREA_ID).find((battle) => battle.isBoss)
    if (!boss) throw new Error('TypeScript Boss was not found')

    expect(boss.skillIds).toContain('ts-narrow')
    expect(boss.skillIds).toContain('ts-keyof')

    const cards = getSkillCardsForBattle(boss, 'typescript-boss')
    expect(cards.find((card) => card.id === 'ts-narrow')?.code).toContain('candidate is')
    expect(cards.find((card) => card.id === 'ts-keyof')?.code).toContain('keyof Enemy')
  })
})
