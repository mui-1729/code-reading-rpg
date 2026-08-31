import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  getAvailableSkillCardsForBattle,
  getBattleSkillAvailability,
  getUnavailableAuthoredSkillIds,
} from './availableSkills'

describe('battle skill availability', () => {
  it('every authored Battle skill is justified by prior mastery or the current trial lesson', () => {
    for (const battle of battles) {
      expect(getUnavailableAuthoredSkillIds(battle), `Battle ${battle.id}`).toEqual([])
    }
  })

  it('Forest && lesson exposes only LINK as trial without exposing later derived variants', () => {
    const battle = battles.find((candidate) => candidate.id === 10)
    expect(battle).toBeDefined()
    if (!battle) return

    const availability = getBattleSkillAvailability(battle.id)
    expect(availability.masteredSkillIds).toEqual(expect.arrayContaining(['trace', 'pulse', 'nova']))
    expect(availability.masteredSkillIds).not.toContain('link')
    expect(availability.trialSkillIds).toEqual(['link'])

    const cards = getAvailableSkillCardsForBattle(battle, 'mastery-test')
    expect(cards.map((card) => card.id)).toEqual(expect.arrayContaining(['trace', 'pulse', 'nova', 'link']))
    expect(cards.map((card) => card.id)).not.toContain('lock')
    expect(cards.map((card) => card.id)).not.toContain('fork')
  })

  it('filter lesson exposes only GATHER as trial while derived incident variants wait for clear', () => {
    const battle = battles.find((candidate) => candidate.id === 14)
    expect(battle).toBeDefined()
    if (!battle) return

    const availability = getBattleSkillAvailability(battle.id)
    expect(availability.masteredSkillIds).toEqual(expect.arrayContaining(['link', 'fork']))
    expect(availability.masteredSkillIds).not.toContain('gather')
    expect(availability.masteredSkillIds).not.toContain('viper')
    expect(availability.trialSkillIds).toEqual(['gather'])

    const cards = getAvailableSkillCardsForBattle(battle, 'filter-trial')
    expect(cards.map((card) => card.id)).toEqual(expect.arrayContaining(['trace', 'gather', 'nova']))
    expect(cards.map((card) => card.id)).not.toContain('viper')
  })

  it('second incident can reuse the Forest skills that were mastered earlier', () => {
    const battle = battles.find((candidate) => candidate.id === 2)
    expect(battle).toBeDefined()
    if (!battle) return

    const cards = getAvailableSkillCardsForBattle(battle, 'second-incident-mastery')
    expect(cards.map((card) => card.id)).toEqual(
      expect.arrayContaining(['trace', 'pulse', 'nova', 'viper', 'lock', 'alert']),
    )
  })

  it('runtime Battle respects the actual mastered Skill cache instead of assuming canonical progress', () => {
    const battle = battles.find((candidate) => candidate.id === 2)
    expect(battle).toBeDefined()
    if (!battle) return

    const runtimeCards = getAvailableSkillCardsForBattle(
      battle,
      'runtime-mastery',
      ['trace', 'pulse', 'nova'],
    )
    const runtimeIds = runtimeCards.map((card) => card.id)

    expect(runtimeIds).toEqual(expect.arrayContaining(['trace', 'pulse', 'nova']))
    expect(runtimeIds).not.toContain('viper')
    expect(runtimeIds).not.toContain('lock')
    expect(runtimeIds).not.toContain('alert')
  })

  it('TypeScript entry exposes its first toolkit only as current-Battle trial', () => {
    const battle = battles.find((candidate) => candidate.id === 4)
    expect(battle).toBeDefined()
    if (!battle) return

    const availability = getBattleSkillAvailability(battle.id)
    expect(availability.masteredSkillIds).not.toContain('ts-scan')
    expect(availability.trialSkillIds).toEqual(['ts-scan', 'ts-guard', 'ts-label'])

    expect(getAvailableSkillCardsForBattle(battle, 'ts-trial').map((card) => card.id)).toEqual(
      expect.arrayContaining(['ts-scan', 'ts-guard', 'ts-label']),
    )
  })
})
