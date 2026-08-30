import { getBattleLearningPolicy, isSyntaxAllowed } from './battleLearningPolicy'
import { battles } from './battles'
import { deepForestSkillDefinitions } from './deepForestSkillDefinitions'
import { forestSkillDefinitions } from './forestSkillDefinitions'
import type { Seed } from './random'
import { semanticSkillVariantsById } from './semanticSkillVariants'
import {
  skillDefinitions as javascriptSkillDefinitions,
  type CodeVariant,
  type SkillDefinition,
} from './skillDefinitions'
import { getTargets } from './targeting'
import { typescriptSkillDefinitions } from './typescriptSkillDefinitions'
import type { Battle, SkillCard, TargetRule } from './types'

export const allSkillDefinitions: readonly SkillDefinition[] = [
  ...javascriptSkillDefinitions,
  ...forestSkillDefinitions,
  ...deepForestSkillDefinitions,
  ...typescriptSkillDefinitions,
]

export const allSkillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  allSkillDefinitions.map((definition) => [definition.id, definition]),
)

type SemanticSource = {
  id: string
  rule: TargetRule
  concept: string
  explanation: string
  codeVariants: readonly CodeVariant[]
  requiredSyntax: readonly import('./battleLearningPolicy').LearningSyntax[]
  pedagogyTags: readonly string[]
  requiresInitialTarget: boolean
}

type EncounterCandidate = {
  semantic: SemanticSource
  variant: CodeVariant
}

function getBaseSemanticSource(definition: SkillDefinition): SemanticSource {
  return {
    id: 'base',
    rule: definition.rule,
    concept: definition.concept,
    explanation: definition.explanation,
    codeVariants: definition.codeVariants,
    requiredSyntax: [],
    pedagogyTags: [],
    requiresInitialTarget: false,
  }
}

function createSkillCard(
  definition: SkillDefinition,
  semantic: SemanticSource,
  variant: CodeVariant,
): SkillCard {
  return {
    id: definition.id,
    name: definition.name,
    code: variant.code,
    power: definition.power,
    rule: semantic.rule,
    concept: semantic.concept,
    explanation: semantic.explanation,
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

const comparisonOperand =
  '(?:[A-Za-z_$][\\w$]*(?:\\.(?:hp|attackDamage|name|score))?|"[^"]*"|\'[^\']*\'|-?\\d+)'
const simpleComparison = new RegExp(
  `(${comparisonOperand})[ \\t]*(<=|>=|===|<|>)[ \\t]*(${comparisonOperand})`,
  'g',
)

function transformLines(code: string, transform: (line: string) => string): string {
  return code.split('\n').map(transform).join('\n')
}

function parenthesizeComparisons(code: string): string {
  return transformLines(code, (line) =>
    line.replace(
      simpleComparison,
      (_match, left: string, operator: string, right: string) =>
        `(${left} ${operator} ${right})`,
    ),
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

function getPresentationCandidates(
  variant: CodeVariant,
  battleId: number,
): CodeVariant[] {
  const policy = getBattleLearningPolicy(battleId)
  const transforms: Array<(code: string) => string> = [(code) => code]

  if (policy.allowedTransforms.includes('comparison-parens')) {
    transforms.push(parenthesizeComparisons)
  }
  if (policy.allowedTransforms.includes('arrow-parameter-parens')) {
    transforms.push(parenthesizeSimpleArrowParameters)
  }
  if (
    policy.allowedTransforms.includes('comparison-parens') &&
    policy.allowedTransforms.includes('arrow-parameter-parens')
  ) {
    transforms.push((code) => parenthesizeSimpleArrowParameters(parenthesizeComparisons(code)))
  }

  return Array.from(
    new Map(
      transforms.map((transform) => {
        const candidate = { ...variant, code: transform(variant.code) }
        return [candidate.code, candidate]
      }),
    ).values(),
  )
}

function getSemanticSources(
  definition: SkillDefinition,
  battleId: number,
  lineMode: CodeVariant['lineMode'],
): SemanticSource[] {
  const battle = battles.find((candidate) => candidate.id === battleId)
  const policy = getBattleLearningPolicy(battleId)
  const alternates = (semanticSkillVariantsById[definition.id] ?? []).map<SemanticSource>(
    (variant) => ({
      id: variant.id,
      rule: variant.rule,
      concept: variant.concept,
      explanation: variant.explanation,
      codeVariants: variant.codeVariants,
      requiredSyntax: variant.requiredSyntax,
      pedagogyTags: variant.pedagogyTags ?? [],
      requiresInitialTarget: variant.requiresInitialTarget ?? false,
    }),
  )

  let candidates = [getBaseSemanticSource(definition), ...alternates].filter(
    (semantic) =>
      semantic.codeVariants.some((variant) => variant.lineMode === lineMode) &&
      isSyntaxAllowed(semantic.requiredSyntax, policy) &&
      (!semantic.requiresInitialTarget ||
        !battle ||
        getTargets(battle.enemies, semantic.rule).length > 0),
  )

  const requiredTags = policy.requiredSemanticTagsBySkillId?.[definition.id] ?? []
  if (requiredTags.length > 0) {
    candidates = candidates.filter((semantic) =>
      requiredTags.every((tag) => semantic.pedagogyTags.includes(tag)),
    )
  }

  if (candidates.length === 0) {
    throw new Error(
      `Skill ${definition.id} has no pedagogically valid ${lineMode} semantic variant for Battle ${battleId}`,
    )
  }

  return candidates
}

function getEncounterCandidate(
  definition: SkillDefinition,
  battleId: number,
  seed: Seed,
  lineMode: CodeVariant['lineMode'],
): EncounterCandidate {
  const candidates = getSemanticSources(definition, battleId, lineMode).flatMap((semantic) =>
    semantic.codeVariants
      .filter((variant) => variant.lineMode === lineMode)
      .flatMap((variant) =>
        getPresentationCandidates(variant, battleId).map((presentation) => ({
          semantic,
          variant: presentation,
        })),
      ),
  )

  const uniqueByCode = new Map<string, EncounterCandidate>()
  for (const candidate of candidates) {
    const existing = uniqueByCode.get(candidate.variant.code)
    if (existing && JSON.stringify(existing.semantic.rule) !== JSON.stringify(candidate.semantic.rule)) {
      throw new Error(
        `Displayed code collision for ${definition.id}: one code string maps to multiple TargetRules`,
      )
    }
    uniqueByCode.set(candidate.variant.code, candidate)
  }

  const uniqueCandidates = [...uniqueByCode.values()]
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

  const selected = getEncounterCandidate(definition, battleId, seed, lineMode)
  return createSkillCard(definition, selected.semantic, selected.variant)
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
    createSkillCard(definition, getBaseSemanticSource(definition), getDefaultVariant(definition)),
  ]),
)
