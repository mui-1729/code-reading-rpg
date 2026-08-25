import { problemTemplates, type ProblemTemplate } from './problemTemplates'
import type { SkillCard } from './types'

function createSkillCard(template: ProblemTemplate): SkillCard {
  const defaultVariant = template.codeVariants[0]
  if (!defaultVariant) throw new Error(`Problem template ${template.templateId} has no code variant`)

  return {
    id: template.id,
    name: template.name,
    code: defaultVariant.code,
    power: template.power,
    rule: template.rule,
    concept: template.concept,
    explanation: template.explanation,
  }
}

export const skills: Record<string, SkillCard> = Object.fromEntries(
  problemTemplates.map((template) => [template.id, createSkillCard(template)]),
)
