import { skillDefinitions, type SkillDefinition } from './skillDefinitions'
import type { SkillCard } from './types'

function createSkillCard(definition: SkillDefinition): SkillCard {
  const defaultVariant = definition.codeVariants[0]
  if (!defaultVariant) throw new Error(`Skill ${definition.id} has no code variant`)

  return {
    id: definition.id,
    name: definition.name,
    code: defaultVariant.code,
    power: definition.power,
    rule: definition.rule,
    concept: definition.concept,
    explanation: definition.explanation,
  }
}

export const skills: Record<string, SkillCard> = Object.fromEntries(
  skillDefinitions.map((definition) => [definition.id, createSkillCard(definition)]),
)
