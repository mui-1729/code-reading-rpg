import { battles } from './battles'
import { deepForestSkillDefinitions } from './deepForestSkillDefinitions'
import { forestSkillDefinitions } from './forestSkillDefinitions'
import type { Seed } from './random'
import {
  skillDefinitions as javascriptSkillDefinitions,
  type CodeVariant,
  type SkillDefinition,
} from './skillDefinitions'
import { typescriptSkillDefinitions } from './typescriptSkillDefinitions'
import type { Battle, SkillCard } from './types'

export const allSkillDefinitions: readonly SkillDefinition[] = [
  ...javascriptSkillDefinitions,
  ...forestSkillDefinitions,
  ...deepForestSkillDefinitions,
  ...typescriptSkillDefinitions,
]

export const allSkillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  allSkillDefinitions.map((definition) => [definition.id, definition]),
)

function createSkillCard(definition: SkillDefinition, variant: CodeVariant): SkillCard {
  return {
    id: definition.id,
    name: definition.name,
    code: variant.code,
    power: definition.power,
    rule: definition.rule,
    concept: definition.concept,
    explanation: definition.explanation,
    codeHelpLines: variant.codeHelpLines,
  }
}

function getDefaultVariant(definition: SkillDefinition): CodeVariant {
  const defaultVariant = definition.codeVariants[0]
  if (!defaultVariant) throw new Error(`Skill ${definition.id} has no code variant`)
  return defaultVariant
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function getEncounterOrdinal(seed: Seed): number | null {
  const value = String(seed)
  const parts = value.split(':')

  if (parts[0] === 'encounter') {
    if (parts.length === 4 && /^\d+$/.test(parts[1] ?? '')) {
      return Number(parts[1])
    }
    if (parts.length >= 5 && /^\d+$/.test(parts[2] ?? '')) {
      return Number(parts[2])
    }
  }

  const boss = /^boss:[^:]+:(\d+)$/.exec(value)
  if (boss?.[1]) return Number(boss[1])

  return null
}

function greatestCommonDivisor(a: number, b: number): number {
  let left = Math.abs(a)
  let right = Math.abs(b)
  while (right !== 0) {
    const next = left % right
    left = right
    right = next
  }
  return left
}

function getCoprimeStride(candidateCount: number): number {
  if (candidateCount <= 2) return 1
  for (let stride = 2; stride < candidateCount; stride += 1) {
    if (greatestCommonDivisor(stride, candidateCount) === 1) return stride
  }
  return 1
}

function getBattleAppearanceIndex(
  definition: SkillDefinition,
  battleId: number,
  lineMode: CodeVariant['lineMode'],
): number {
  const appearances = battles.filter((battle) => {
    if (!battle.skillIds.includes(definition.id)) return false
    const multiLine = battle.multiLineSkillIds?.includes(definition.id) ?? false
    return (lineMode === 'multi') === multiLine
  })
  return Math.max(0, appearances.findIndex((battle) => battle.id === battleId))
}

const reversedOperators: Record<string, string> = {
  '<': '>',
  '>': '<',
  '<=': '>=',
  '>=': '<=',
  '===': '===',
}

const comparisonOperand =
  '(?:[A-Za-z_$][\\w$]*(?:\\.(?:hp|attackDamage|name|score))?|"[^"]*"|\'[^\']*\'|-?\\d+)'
const reversibleComparison = new RegExp(
  `(${comparisonOperand})[ \\t]*(<=|>=|===|<|>)[ \\t]*(${comparisonOperand})`,
  'g',
)

function transformLines(code: string, transform: (line: string) => string): string {
  return code.split('\n').map(transform).join('\n')
}

function reverseComparisons(code: string): string {
  return transformLines(code, (line) =>
    line.replace(
      reversibleComparison,
      (_match, left: string, operator: string, right: string) =>
        `${right} ${reversedOperators[operator] ?? operator} ${left}`,
    ),
  )
}

const dataPropertyPattern = 'hp|attackDamage|name|score|enemy|value|limit|stats'

function useBracketPropertyAccess(code: string): string {
  const optionalPattern = new RegExp(`\\?\\.(${dataPropertyPattern})\\b`, 'g')
  const directPattern = new RegExp(`\\.(${dataPropertyPattern})\\b`, 'g')

  return transformLines(code, (line) =>
    line
      .replace(optionalPattern, (_match, property: string) => `?.["${property}"]`)
      .replace(directPattern, (_match, property: string) => `["${property}"]`),
  )
}

function parenthesizeSimpleArrowParameters(code: string): string {
  return transformLines(code, (line) =>
    line.replace(
      /(^|[(,][ \t]*)([A-Za-z_$][\w$]*)[ \t]*=>/g,
      (_match, prefix: string, parameter: string) => `${prefix}(${parameter}) =>`,
    ),
  )
}

function getSemanticCandidates(variant: CodeVariant): CodeVariant[] {
  const comparisonTransforms = [(code: string) => code, reverseComparisons]
  const propertyTransforms = [(code: string) => code, useBracketPropertyAccess]
  const arrowTransforms = [(code: string) => code, parenthesizeSimpleArrowParameters]
  const seen = new Set<string>()
  const candidates: CodeVariant[] = []

  for (const comparisonTransform of comparisonTransforms) {
    for (const propertyTransform of propertyTransforms) {
      for (const arrowTransform of arrowTransforms) {
        const code = arrowTransform(propertyTransform(comparisonTransform(variant.code)))
        if (seen.has(code)) continue
        seen.add(code)
        candidates.push({ ...variant, code })
      }
    }
  }

  return candidates
}

function getEncounterVariant(
  definition: SkillDefinition,
  battleId: number,
  seed: Seed,
  lineMode: CodeVariant['lineMode'],
): CodeVariant {
  const eligibleVariants = definition.codeVariants.filter(
    (variant) => variant.lineMode === lineMode,
  )
  if (eligibleVariants.length === 0) {
    throw new Error(`Skill ${definition.id} has no ${lineMode} code variant`)
  }

  const candidates = eligibleVariants.flatMap(getSemanticCandidates)
  const uniqueCandidates = Array.from(
    new Map(candidates.map((candidate) => [candidate.code, candidate])).values(),
  )
  if (uniqueCandidates.length === 0) {
    throw new Error(`Skill ${definition.id} has no generated code variant`)
  }

  const encounterOrdinal = getEncounterOrdinal(seed)
  const appearanceIndex = getBattleAppearanceIndex(definition, battleId, lineMode)
  const stride = getCoprimeStride(uniqueCandidates.length)
  const base =
    encounterOrdinal ?? hashString(`${battleId}:${String(seed)}:${definition.id}:semantic`)
  const variationNumber = base + appearanceIndex * stride
  const selected = uniqueCandidates[variationNumber % uniqueCandidates.length]
  if (!selected) throw new Error(`Skill ${definition.id} has no generated code variant`)
  return selected
}

export function getSkillCardForBattle(
  skillId: string,
  battleId: number,
  seed: Seed,
  lineMode: CodeVariant['lineMode'] = 'single',
): SkillCard {
  const definition = allSkillDefinitionById[skillId]
  if (!definition) throw new Error(`Unknown skill: ${skillId}`)

  return createSkillCard(
    definition,
    getEncounterVariant(definition, battleId, seed, lineMode),
  )
}

export function getSkillCardsForBattle(battle: Battle, seed: Seed): SkillCard[] {
  const multiLineSkillIds = new Set(battle.multiLineSkillIds ?? [])

  return battle.skillIds.map((skillId) =>
    getSkillCardForBattle(
      skillId,
      battle.id,
      seed,
      multiLineSkillIds.has(skillId) ? 'multi' : 'single',
    ),
  )
}

export const skills: Record<string, SkillCard> = Object.fromEntries(
  allSkillDefinitions.map((definition) => [
    definition.id,
    createSkillCard(definition, getDefaultVariant(definition)),
  ]),
)
