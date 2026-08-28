import { describe, expect, it } from 'vitest'
import { applyBattleVictory, createInitialPlayerProgress } from '../progression'
import { getEncounterBattleId, JS_FOREST_MAP_ID } from '../world/worldMap'
import { battles } from './battles'
import { generateBattle } from './generator'
import { isBattleSolvable } from './solvability'

describe('JavaScript Forest midboss battle', () => {
  const midboss = battles.find((battle) => battle.id === 13)

  it('既習Skillだけを使い、Area BossやBoss Guard対象にはしない', () => {
    expect(midboss).toBeDefined()
    expect(midboss?.skillIds).toEqual(['trace', 'pulse', 'nova', 'link', 'fork'])
    expect(midboss?.isBoss).not.toBe(true)
    expect(midboss?.unlockSkillId).toBeUndefined()
    expect(midboss?.multiLineSkillIds).toBeUndefined()
  })

  it('clearしてもJavaScript Area CLEARにはしない', () => {
    expect(midboss).toBeDefined()
    if (!midboss) return

    const result = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: midboss.id,
      expReward: midboss.expReward,
      goldReward: midboss.goldReward,
      clearAreaId: midboss.isBoss ? midboss.areaId : undefined,
    })

    expect(result.progress.clearedStageIds).toContain(13)
    expect(result.progress.clearedAreaIds).not.toContain('javascript')
    expect(result.reward.clearedAreaId).toBeUndefined()
  })

  it('base battleとseeded variantが解ける', () => {
    expect(midboss && isBattleSolvable(midboss)).toBe(true)

    for (const seed of ['midboss-a', 'midboss-b', 'midboss-c']) {
      const generated = generateBattle(13, seed)
      expect(generated).toBeDefined()
      expect(generated && isBattleSolvable(generated)).toBe(true)
    }
  })

  it('Forest Random Encounter poolへBattle 13を混ぜない', () => {
    const cleared = [7, 8, 9, 10, 11, 12, 13]
    const unlocked = [10, 11, 12, 13]

    for (const roll of [0.05, 0.4, 0.75, 0.99]) {
      const battleId = getEncounterBattleId('javascript', unlocked, cleared, roll, JS_FOREST_MAP_ID)
      expect([10, 11, 12]).toContain(battleId)
    }
  })
})
