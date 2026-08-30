import { describe, expect, it } from 'vitest'
import { getBattleLearningPolicy } from './battleLearningPolicy'
import { battles } from './battles'
import { getSkillCardForBattle, getSkillCardsForBattle } from './skills'

describe('pedagogical semantic variation', () => {
  it('全Battleに明示的なallowedSyntax policyがある', () => {
    for (const battle of battles) {
      const policy = getBattleLearningPolicy(battle.id)
      expect(policy.allowedSyntax.length, `Battle ${battle.id}`).toBeGreaterThan(0)
    }
  })

  it('PULSEのSlime semantic variantは===とnameを学習済みのBattleだけに出る', () => {
    for (const battle of battles.filter((candidate) => candidate.skillIds.includes('pulse'))) {
      const policy = getBattleLearningPolicy(battle.id)
      for (let ordinal = 0; ordinal < 32; ordinal += 1) {
        const card = getSkillCardForBattle('pulse', battle.id, `encounter:${ordinal}:pulse:syntax`)
        if (!card.code.includes('"Slime"')) continue
        expect(policy.allowedSyntax).toContain('find')
        expect(policy.allowedSyntax).toContain('name-property')
        expect(policy.allowedSyntax).toContain('strict-equality')
      }
    }
  })

  it('TypeScript Stage 5/6のUNION CUTは必ずtype-relevant contract variantになる', () => {
    for (const battleId of [5, 6]) {
      const battle = battles.find((candidate) => candidate.id === battleId)
      if (!battle) throw new Error(`Battle ${battleId} not found`)

      for (let ordinal = 0; ordinal < 64; ordinal += 1) {
        const card = getSkillCardsForBattle(battle, `encounter:${ordinal}:type:required`).find(
          (candidate) => candidate.id === 'ts-union',
        )
        if (!card) throw new Error('UNION CUT not found')

        expect(card.concept).toBe('union type + literal return contract')
        expect(card.code).toContain('getLimit as () =>')
        expect(card.codeHelpLines).toHaveLength(card.code.split('\n').length)
      }
    }
  })

  it('UNION CUTは型情報を除くと現在thresholdを判定できない', () => {
    const battle = battles.find((candidate) => candidate.id === 5)
    if (!battle) throw new Error('Battle 5 not found')

    for (let ordinal = 0; ordinal < 16; ordinal += 1) {
      const card = getSkillCardsForBattle(battle, `encounter:${ordinal}:type:necessary`).find(
        (candidate) => candidate.id === 'ts-union',
      )
      if (!card || card.rule.kind !== 'allBelow') throw new Error('UNION CUT rule missing')

      const runtimeOnly = card.code
        .split('\n')
        .filter((line) => !line.startsWith('type '))
        .join('\n')
        .replace(/ as \(\) => (60|100)/g, '')
        .replace(/: Limit/g, '')

      expect(runtimeOnly).not.toContain(`hp < ${card.rule.hp}`)
      expect(runtimeOnly).not.toContain(`hp < (${card.rule.hp})`)
      expect(card.explanation).toContain(String(card.rule.hp))
    }
  })
})
