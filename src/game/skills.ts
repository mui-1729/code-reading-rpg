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

function shortHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function makeBattleUniqueVariant(
  variant: CodeVariant,
  battleId: number,
  seed: Seed,
  skillId: string,
): CodeVariant {
  const aliases = ['foes', 'roster', 'units', 'opponents', 'targets']
  const random = createSeededRandom(`${battleId}:${String(seed)}:${skillId}:alias`)
  const base = aliases[random.int(0, aliases.length - 1)] ?? 'foes'
  const alias = `${base}_${battleId}_${shortHash(String(seed)).slice(0, 5)}`
  const originalLines = variant.code.split('\n')
  const rewritten = variant.code.replace(/\benemies\b/g, alias)
  const generatedHelp = originalLines.map((_, index) =>
    index === originalLines.length - 1
      ? 'この行が最終的にどのEnemyを返すかを読む。'
      : 'この中間処理が次の行へ渡す値を確認する。',
  )

  return {
    ...variant,
    code: `const ${alias} = enemies\n${rewritten}`,
    codeHelpLines: [
      `${alias} はこのBattle時点のEnemy一覧。Battleごとに別名になる。`,
      ...(variant.codeHelpLines ?? generatedHelp),
    ],
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

  const random = createSeededRandom(`${battleId}:${String(seed)}:${skillId}:code-variant`)
  const selected = eligibleVariants[random.int(0, eligibleVariants.length - 1)]
  if (!selected) throw new Error(`Skill ${skillId} has no code variant`)

  return createSkillCard(
    definition,
    makeBattleUniqueVariant(selected, battleId, seed, skillId),
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
