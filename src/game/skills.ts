import { createSeededRandom, type Seed } from './random'
import {
  skillDefinitionById,
  skillDefinitions,
  type CodeVariant,
  type SkillDefinition,
} from './skillDefinitions'
import type { SkillCard } from './types'

function createSkillCard(definition: SkillDefinition, variant: CodeVariant): SkillCard {
  return {
    id: definition.id,
    name: definition.name,
    code: variant.code,
    power: definition.power,
    rule: definition.rule,
    concept: definition.concept,
    explanation: definition.explanation,
  }
}

function getDefaultVariant(definition: SkillDefinition): CodeVariant {
  const defaultVariant = definition.codeVariants[0]
  if (!defaultVariant) throw new Error(`Skill ${definition.id} has no code variant`)
  return defaultVariant
}

export function getSkillCardForBattle(
  skillId: string,
  battleId: number,
  seed: Seed,
): SkillCard | undefined {
  const definition = skillDefinitionById[skillId]
  if (!definition) return undefined

  const random = createSeededRandom(`${battleId}:${String(seed)}:${skillId}:code-variant`)
  const variant = definition.codeVariants[random.int(0, definition.codeVariants.length - 1)]
  if (!variant) return undefined

  return createSkillCard(definition, variant)
}

export const skills: Record<string, SkillCard> = Object.fromEntries(
  skillDefinitions.map((definition) => [
    definition.id,
    createSkillCard(definition, getDefaultVariant(definition)),
  ]),
)
