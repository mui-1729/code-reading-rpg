import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { isBattleSolvable } from './solvability'
import { allSkillDefinitionById } from './skills'
import { getTargets } from './targeting'
import { getEncounterBattleId, JS_DEEP_FOREST_MAP_ID } from '../world/worldMap'

describe('JavaScript Deep Forest filter repeat', () => {
  const lesson = battles.find((battle) => battle.id === 15)

  it('filter()の意味を保ったまま<から>へ条件だけを変える', () => {
    expect(lesson).toBeDefined()
    expect(lesson?.skillIds).toEqual(['gather', 'echo', 'trace'])
    expect(lesson?.unlockSkillId).toBe('echo')

    const gather = allSkillDefinitionById.gather
    const echo = allSkillDefinitionById.echo
    expect(gather?.rule).toEqual({ kind: 'allBelow', hp: 45 })
    expect(echo?.rule).toEqual({ kind: 'allAbove', hp: 65 })

    if (!lesson || !gather || !echo) throw new Error('deep forest filter fixture is missing')
    expect(getTargets(lesson.enemies, gather.rule)).toHaveLength(1)
    expect(getTargets(lesson.enemies, echo.rule)).toHaveLength(2)
  })

  it('base battleとseeded variantが解ける', () => {
    expect(lesson && isBattleSolvable(lesson)).toBe(true)

    for (const seed of ['deep-filter-a', 'deep-filter-b', 'deep-filter-c']) {
      const generated = generateBattle(15, seed)
      expect(generated).toBeDefined()
      expect(generated && isBattleSolvable(generated)).toBe(true)
    }
  })

  it('Battle 15 clear前のDeep Forest Randomは学習済みBattle 14だけ', () => {
    const cleared = [7, 8, 9, 10, 11, 12, 13, 14]
    const unlocked = [10, 11, 12, 13, 14, 15]

    for (const roll of [0.05, 0.5, 0.99]) {
      expect(
        getEncounterBattleId('javascript', unlocked, cleared, roll, JS_DEEP_FOREST_MAP_ID),
      ).toBe(14)
    }
  })

  it('Battle 15 clear後はDeep Forest Randomで14 / 15を反復できる', () => {
    const cleared = [7, 8, 9, 10, 11, 12, 13, 14, 15]
    const unlocked = [10, 11, 12, 13, 14, 15]

    expect(getEncounterBattleId('javascript', unlocked, cleared, 0.1, JS_DEEP_FOREST_MAP_ID)).toBe(14)
    expect(getEncounterBattleId('javascript', unlocked, cleared, 0.9, JS_DEEP_FOREST_MAP_ID)).toBe(15)
  })
})
