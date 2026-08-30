import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  allSkillDefinitionById,
  allSkillDefinitions,
  getSkillCardsForBattle,
} from './skills'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (id: string, name: string, hp: number, attackDamage: number): Enemy => ({
  id,
  name,
  hp,
  maxHp: Math.max(hp, 100),
  attackName: 'Test Attack',
  attackDamage,
  glyph: '•',
})

const board = [
  enemy('dead', 'Goblin', 0, 99),
  enemy('sprout', 'Sprout', 30, 5),
  enemy('goblin-low', 'Goblin', 54, 15),
  enemy('goblin-high', 'Goblin', 90, 8),
  enemy('guardian', 'Guardian', 130, 20),
]

type SemanticFixture = {
  targetIds: readonly string[]
  power: number
  baseCodeFingerprint: string
}

const fingerprint = (value: string) => {
  let fnv = 2166136261
  let djb = 5381
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    fnv = Math.imul(fnv ^ codePoint, 16777619)
    djb = Math.imul(djb, 33) ^ codePoint
  }
  return `${(fnv >>> 0).toString(16).padStart(8, '0')}${(djb >>> 0)
    .toString(16)
    .padStart(8, '0')}`
}

const definitionFingerprint = (definition: (typeof allSkillDefinitions)[number]) =>
  fingerprint(
    definition.codeVariants.map((variant) => `${variant.id}\u0000${variant.code}`).join('\u0001'),
  )

/**
 * Review-owned oracle for base displayed-code meaning. Targets and POWER are deliberately
 * independent from TargetRule implementation; the fingerprint freezes every base code variant.
 */
const fixtures: Record<string, SemanticFixture> = {
  trace: { targetIds: ['sprout'], power: 34, baseCodeFingerprint: '2fd6451c1524e382' },
  pulse: { targetIds: ['goblin-low'], power: 48, baseCodeFingerprint: '0ce45f7c1b93ea9c' },
  nova: { targetIds: ['goblin-high'], power: 62, baseCodeFingerprint: '33f87017cb0445c7' },
  viper: {
    targetIds: ['sprout', 'goblin-low'],
    power: 22,
    baseCodeFingerprint: 'ba6f28f2df5ceea6',
  },
  lock: {
    targetIds: ['goblin-low', 'goblin-high'],
    power: 24,
    baseCodeFingerprint: '819515c98a6a16b9',
  },
  alert: { targetIds: ['goblin-low'], power: 40, baseCodeFingerprint: '4db2dd04a84d8520' },
  echo: {
    targetIds: ['goblin-high', 'guardian'],
    power: 26,
    baseCodeFingerprint: '338f6df3609737c7',
  },
  'moon-edge': { targetIds: ['sprout'], power: 72, baseCodeFingerprint: 'daddaeeede648196' },
  sweep: {
    targetIds: ['sprout', 'goblin-low', 'goblin-high', 'guardian'],
    power: 18,
    baseCodeFingerprint: 'bfa5241e57cb5fde',
  },
  judge: { targetIds: ['guardian'], power: 52, baseCodeFingerprint: '723d1af58514b227' },
  link: { targetIds: ['goblin-low'], power: 44, baseCodeFingerprint: 'f66af457e30f9cd3' },
  fork: { targetIds: ['sprout'], power: 46, baseCodeFingerprint: '88c11dcb2da610d1' },
  gather: { targetIds: ['sprout'], power: 22, baseCodeFingerprint: '6d8c91eddb3f4eb1' },
  project: { targetIds: ['sprout'], power: 40, baseCodeFingerprint: '72e42e6a2fa398c4' },
  signal: {
    targetIds: ['sprout', 'goblin-low', 'goblin-high', 'guardian'],
    power: 20,
    baseCodeFingerprint: 'f84d93493ed8b049',
  },
  sync: { targetIds: [], power: 22, baseCodeFingerprint: '4c333ad98a8b5a2b' },
  order: { targetIds: ['sprout'], power: 58, baseCodeFingerprint: 'e86750efa6791cbd' },
  'safe-path': { targetIds: ['sprout'], power: 60, baseCodeFingerprint: '51d16b57205ce3fd' },
  'reduce-focus': { targetIds: ['guardian'], power: 54, baseCodeFingerprint: '40fbb334950fba40' },
  'ts-scan': { targetIds: ['sprout'], power: 38, baseCodeFingerprint: 'fa2859f8d4c3bce8' },
  'ts-guard': {
    targetIds: ['goblin-high', 'guardian'],
    power: 24,
    baseCodeFingerprint: 'a7f78e21ccb409a3',
  },
  'ts-label': { targetIds: ['goblin-low'], power: 48, baseCodeFingerprint: '453f23cb0c9cf2f7' },
  'ts-union': {
    targetIds: ['sprout', 'goblin-low'],
    power: 28,
    baseCodeFingerprint: 'caf7143c33293524',
  },
  'ts-optional': { targetIds: ['sprout'], power: 42, baseCodeFingerprint: '4d2f335cb646a5a4' },
  'ts-narrow': { targetIds: ['guardian'], power: 54, baseCodeFingerprint: 'f4cb5b9ea6243be4' },
  'ts-keyof': { targetIds: ['sprout'], power: 70, baseCodeFingerprint: 'ab2c53e17deef6ff' },
}

describe('displayed code target/effect independent oracle', () => {
  it('全registered Skillにreview-owned base fixtureがある', () => {
    expect(Object.keys(fixtures).sort()).toEqual(
      allSkillDefinitions.map((definition) => definition.id).sort(),
    )
  })

  it.each(allSkillDefinitions)(
    '$idの全base variant・runtime target・effectがreview-owned fixtureと一致する',
    (definition) => {
      const fixture = fixtures[definition.id]
      expect(fixture, `${definition.id} needs an independent semantic fixture`).toBeDefined()
      expect(definitionFingerprint(definition)).toBe(fixture?.baseCodeFingerprint)
      expect(definition.power).toBe(fixture?.power)
      expect(getTargets(board, definition.rule).map((target) => target.id)).toEqual(
        fixture?.targetIds,
      )
    },
  )

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
