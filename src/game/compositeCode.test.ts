import { describe, expect, it } from 'vitest'
import { generateBattle } from './generator'
import { skillDefinitionById } from './skillDefinitions'
import { getSkillCardsForBattle } from './skills'

describe('composite code battle', () => {
  it('Battle 3の複合Skillは2種類以上の処理を組み合わせる', () => {
    const moonEdge = skillDefinitionById['moon-edge'].codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )
    const sweep = skillDefinitionById.sweep.codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )
    const judge = skillDefinitionById.judge.codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )

    for (const variant of moonEdge) {
      expect(variant.code).toContain('.filter(')
      expect(variant.code).toContain('.sort(')
      expect(variant.code).toContain('[0]')
    }
    for (const variant of sweep) {
      expect(variant.code).toContain('.filter(')
      expect(variant.code.includes('.some(') || variant.code.includes('.every(')).toBe(true)
      expect(variant.code).toContain('?')
      expect(variant.code).toContain(':')
    }
    for (const variant of judge) {
      expect(variant.code).toContain('.filter(')
      expect(variant.code).toContain('.map(')
      expect(variant.code).toContain('.reduce(')
    }
  })

  it('複合Skillは中間変数を使い最終結果まで3段階で追える', () => {
    for (const skillId of ['moon-edge', 'sweep', 'judge']) {
      const multiVariants = skillDefinitionById[skillId].codeVariants.filter(
        (variant) => variant.lineMode === 'multi',
      )

      for (const variant of multiVariants) {
        const lines = variant.code.split('\n')
        expect(lines).toHaveLength(3)
        expect(lines[0]).toMatch(/^const /)
        expect(lines[1]).toMatch(/^const /)
        expect(lines[2].startsWith('const ')).toBe(false)
      }
    }
  })

  it('生成されたBattle 3 cardへ行別CODE HELPが引き継がれる', () => {
    for (let index = 0; index < 20; index += 1) {
      const seed = `composite-help-${index}`
      const battle = generateBattle(3, seed)
      expect(battle).toBeDefined()
      if (!battle) continue

      const cards = getSkillCardsForBattle(battle, seed)
      for (const skillId of ['moon-edge', 'sweep', 'judge']) {
        const card = cards.find((candidate) => candidate.id === skillId)
        expect(card).toBeDefined()
        expect(card?.code.split('\n')).toHaveLength(3)
        expect(card?.codeHelpLines).toHaveLength(3)
      }
    }
  })

  it('map()を使うJUDGEはscore付きobjectを作ってからreduce()する', () => {
    const variants = skillDefinitionById.judge.codeVariants.filter(
      (variant) => variant.lineMode === 'multi',
    )

    for (const variant of variants) {
      expect(variant.code).toContain('score:')
      expect(variant.code).toContain('.score > best.score')
      expect(variant.code.endsWith('.enemy')).toBe(true)
    }
  })
})
