import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { allSkillDefinitionById, getSkillCardsForBattle } from './skills'

describe('displayed code semantics', () => {
  it('PULSEの表示literalとruntime TargetRuleが一致する', () => {
    const battle = battles.find((candidate) => candidate.id === 1)
    if (!battle) throw new Error('Battle 1 not found')

    for (let ordinal = 0; ordinal < 64; ordinal += 1) {
      const pulse = getSkillCardsForBattle(battle, `encounter:${ordinal}:semantic:oracle`).find(
        (card) => card.id === 'pulse',
      )
      if (!pulse) throw new Error('PULSE not found')

      if (pulse.code.includes('"Slime"')) {
        expect(pulse.rule).toEqual({ kind: 'named', name: 'Slime' })
      } else if (pulse.code.includes('"Goblin"')) {
        expect(pulse.rule).toEqual({ kind: 'named', name: 'Goblin' })
      } else {
        throw new Error(`Unknown PULSE semantics: ${pulse.code}`)
      }
    }
  })

  it('UNION CUTの表示type contractとruntime TargetRuleが一致する', () => {
    const battle = battles.find((candidate) => candidate.id === 5)
    if (!battle) throw new Error('Battle 5 not found')

    for (let ordinal = 0; ordinal < 64; ordinal += 1) {
      const card = getSkillCardsForBattle(battle, `encounter:${ordinal}:typescript:oracle`).find(
        (candidate) => candidate.id === 'ts-union',
      )
      if (!card) throw new Error('UNION CUT not found')

      if (card.code.includes('() => 60')) {
        expect(card.rule).toEqual({ kind: 'allBelow', hp: 60 })
      } else if (card.code.includes('() => 100')) {
        expect(card.rule).toEqual({ kind: 'allBelow', hp: 100 })
      } else {
        throw new Error(`Unknown UNION CUT semantics: ${card.code}`)
      }
    }
  })

  it('semantic variation対象外Skillはbase TargetRuleを維持する', () => {
    for (const battle of battles) {
      for (const card of getSkillCardsForBattle(battle, 'semantic-base-check')) {
        if (card.id === 'pulse' || card.id === 'ts-union') continue
        expect(card.rule).toEqual(allSkillDefinitionById[card.id].rule)
      }
    }
  })

  it('未学習のbracket property accessや比較左右反転を自動生成しない', () => {
    for (const battle of battles) {
      for (let ordinal = 0; ordinal < 24; ordinal += 1) {
        const cards = getSkillCardsForBattle(battle, `encounter:${ordinal}:syntax:oracle`)
        for (const card of cards) {
          expect(card.code).not.toContain('["hp"]')
          expect(card.code).not.toContain('["name"]')
          expect(card.code).not.toContain('["attackDamage"]')
          expect(card.code).not.toContain('45 >')
          expect(card.code).not.toContain('55 >')
          expect(card.code).not.toContain('60 <')
          expect(card.code).not.toContain('65 <')
        }
      }
    }
  })
})
