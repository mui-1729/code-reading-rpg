import { createSeededRandom, type Seed } from './random'
import { skillDefinitionById, skillDefinitions, type SkillDefinition } from './skillDefinitions'
import type { SkillCard } from './types'

function createSkillCard(definition: SkillDefinition, code: string): SkillCard {
  return {
    id: definition.id,
    name: definition.name,
    code,
    power: definition.power,
    rule: definition.rule,
    concept: definition.concept,
    explanation: definition.explanation,
  }
}

function createDefaultSkillCard(definition: SkillDefinition): SkillCard {
  const defaultVariant = definition.codeVariants[0]
  if (!defaultVariant) throw new Error(`Skill ${definition.id} has no code variant`)
  return createSkillCard(definition, defaultVariant.code)
}

export const skills: Record<string, SkillCard> = Object.fromEntries(
  skillDefinitions.map((definition) => [definition.id, createDefaultSkillCard(definition)]),
)

export function resolveSkillCard(
  skillId: string,
  battleId: number,
  seed: Seed,
): SkillCard | undefined {
  const definition = skillDefinitionById[skillId]
  if (!definition) return undefined

  const random = createSeededRandom(`${String(seed)}:battle:${battleId}:skill:${skillId}:code`)
  const variantIndex = random.int(0, definition.codeVariants.length - 1)
  const variant = definition.codeVariants[variantIndex]
  if (!variant) return undefined

  return createSkillCard(definition, variant.code)
}
