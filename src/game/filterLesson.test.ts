import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { isBattleSolvable } from './solvability'
import { allSkillDefinitionById } from './skills'
import { getTargets } from './targeting'
import { getEncounterBattleId, JS_FOREST_MAP_ID } from '../world/worldMap'

describe('JavaScript filter lesson', () => {
  const lesson = battles.find((battle) => battle.id === 14)

  it('find()とfilter()を同じhp < 45条件で比較する', () => {
    expect(lesson).toBeDefined()
    expect(lesson?.skillIds).toEqual(['trace', 'gather', 'nova'])
    expect(lesson?.unlockSkillId).toBe('gather')

    const trace = allSkillDefinitionById.trace
    const gather = allSkillDefinitionById.gather
    expect(trace?.rule).toEqual({ kind: 'firstBelow', hp: 45 })
    expect(gather?.rule).toEqual({ kind: 'allBelow', hp: 45 })

    if (!lesson || !trace || !gather) throw new Error('filter lesson fixture is missing')
    expect(getTargets(lesson.enemies, trace.rule)).toHaveLength(1)
    expect(getTargets(lesson.enemies, gather.rule)).toHaveLength(2)
  })

  it('base battleとseeded variantが解ける', () => {
    expect(lesson && isBattleSolvable(lesson)).toBe(true)

    for (const seed of ['filter-a', 'filter-b', 'filter-c']) {
      const generated = generateBattle(14, seed)
      expect(generated).toBeDefined()
      expect(generated && isBattleSolvable(generated)).toBe(true)
    }
  })

  it('Battle 14 clear前はRandom poolへfilter lessonを混ぜない', () => {
    const cleared = [7, 8, 9, 10, 11, 12, 13]
    const unlocked = [10, 11, 12, 13, 14]

    for (const roll of [0.05, 0.35, 0.7, 0.99]) {
      expect(getEncounterBattleId('javascript', unlocked, cleared, roll, JS_FOREST_MAP_ID)).not.toBe(14)
    }
  })

  it('Battle 14 clear後はRandom poolでfilter lessonを復習できる', () => {
    const cleared = [7, 8, 9, 10, 11, 12, 13, 14]
    const unlocked = [10, 11, 12, 13, 14]

    expect(getEncounterBattleId('javascript', unlocked, cleared, 0.99, JS_FOREST_MAP_ID)).toBe(14)
  })
})
