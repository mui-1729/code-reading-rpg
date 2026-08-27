import { createSeededRandom, type Seed } from './random'
import {
  skillDefinitions as javascriptSkillDefinitions,
  type CodeVariant,
  type SkillDefinition,
} from './skillDefinitions'
import { typescriptSkillDefinitions } from './typescriptSkillDefinitions'
import type { Battle, SkillCard } from './types'

export const allSkillDefinitions: readonly SkillDefinition[] = [
  ...javascriptSkillDefinitions,
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

function getBattleVariantIndex(battleId: number, variantCount: number): number {
  if (variantCount <= 1) return 0

  const areaBattleIndex = battleId >= 4 ? battleId - 4 : battleId - 1
  return Math.abs(areaBattleIndex) % variantCount
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const reversedOperators: Record<string, string> = {
  '<': '>',
  '>': '<',
  '<=': '>=',
  '>=': '<=',
  '===': '===',
}

function reverseLiteralComparisons(code: string): string {
  return code.replace(
    /\b([A-Za-z_$][\w$]*\.(?:hp|attackDamage|name))\s*(<=|>=|===|<|>)\s*("[^"]*"|'[^']*'|\d+)/g,
    (_match, left: string, operator: string, right: string) =>
      `${right} ${reversedOperators[operator] ?? operator} ${left}`,
  )
}

function makeSemanticReplayVariant(
  variant: CodeVariant,
  battleId: number,
  skillId: string,
  seed: Seed,
): CodeVariant {
  const shouldReverse = (hashString(`${battleId}:${String(seed)}:${skillId}:semantic`) & 1) === 1
  if (!shouldReverse) return variant

  return {
    ...variant,
    code: reverseLiteralComparisons(variant.code),
  }
}

export function getSkillCardForBattle(
  skillId: string,
  battleId: number,
  seed: Seed,
  lineMode: CodeVariant['lineMode'] = 'single',
): SkillCard {
  const definition = allSkillDefinitionById[skillId]
  if (!definition) throw new Error(`Unknown skill: ${skillId}`)

  const eligibleVariants = definition.codeVariants.filter(
    (variant) => variant.lineMode === lineMode,
  )
  if (eligibleVariants.length === 0) {
    throw new Error(`Skill ${skillId} has no ${lineMode} code variant`)
  }

  // Reused SkillはBattleごとに別のbase variantを担当させる。
  // seedはそのbase codeの同値な比較表現だけを変え、TargetRuleには触れない。
  const selected = eligibleVariants[getBattleVariantIndex(battleId, eligibleVariants.length)]
  if (!selected) throw new Error(`Skill ${skillId} has no code variant`)

  const semanticVariant = makeSemanticReplayVariant(selected, battleId, skillId, seed)
  return createSkillCard(definition, semanticVariant)
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
