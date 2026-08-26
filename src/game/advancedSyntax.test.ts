import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { skillDefinitionById } from './skillDefinitions'
import { typescriptSkillDefinitionById } from './typescriptSkillDefinitions'
import { learningHints } from '../learning/learningHints'
import { typescriptLearningHints } from '../learning/typescriptLearningHints'

describe('advanced syntax content', () => {
  it('JavaScript Codexに発展構文を登録する', () => {
    const concepts = new Set(learningHints.map((hint) => hint.concept))

    expect(concepts.has('every()')).toBe(true)
    expect(concepts.has('destructuring')).toBe(true)
    expect(concepts.has('?. / ??')).toBe(true)
    expect(concepts.has('nested object')).toBe(true)
  })

  it('TypeScript CodexにgenericとPickを登録する', () => {
    const concepts = new Set(typescriptLearningHints.map((hint) => hint.concept))

    expect(concepts.has('generic')).toBe(true)
    expect(concepts.has('Pick<T, K>')).toBe(true)
  })

  it('Battle 3だけがJavaScript発展variantを利用できる', () => {
    const boss = battles.find((battle) => battle.id === 3)
    if (!boss) throw new Error('JavaScript Boss was not found')

    expect(boss.multiLineSkillIds).toEqual(expect.arrayContaining(['moon-edge', 'sweep']))

    const moonVariants = skillDefinitionById['moon-edge'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )
    const sweepVariants = skillDefinitionById['sweep'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )

    const nestedSafe = moonVariants.find((variant) => variant.id === 'nested-safe')
    expect(nestedSafe?.code).toContain('filter(({ hp })')
    expect(nestedSafe?.code).toContain('stats: { hp: enemy.hp }')
    expect(nestedSafe?.code).toContain('stats?.hp ?? Infinity')

    const everyVariant = sweepVariants.find((variant) => variant.id === 'every-destructured')
    expect(everyVariant?.code).toContain('every(({ hp }) => hp >= 50)')
  })

  it('Battle 6だけがTypeScript発展variantを利用できる', () => {
    const boss = battles.find((battle) => battle.id === 6)
    if (!boss) throw new Error('TypeScript Boss was not found')

    expect(boss.multiLineSkillIds).toEqual(expect.arrayContaining(['ts-narrow', 'ts-keyof']))

    const narrowVariants = typescriptSkillDefinitionById['ts-narrow'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )
    const keyofVariants = typescriptSkillDefinitionById['ts-keyof'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )

    expect(narrowVariants.find((variant) => variant.id === 'generic-scored')?.code).toContain(
      'type Scored<T>',
    )
    expect(keyofVariants.find((variant) => variant.id === 'pick-hp')?.code).toContain(
      'Pick<Enemy, "hp">',
    )
  })

  it('発展構文をBattle 1〜2 / Stage 4〜5へ追加しない', () => {
    const baselineBattleSkillIds = new Set(
      battles
        .filter((battle) => [1, 2, 4, 5].includes(battle.id))
        .flatMap((battle) => battle.skillIds),
    )

    expect(baselineBattleSkillIds.has('moon-edge')).toBe(false)
    expect(baselineBattleSkillIds.has('sweep')).toBe(false)
    expect(baselineBattleSkillIds.has('ts-narrow')).toBe(false)
    expect(baselineBattleSkillIds.has('ts-keyof')).toBe(false)
  })
})
