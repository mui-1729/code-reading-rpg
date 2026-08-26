import { describe, expect, it } from 'vitest'
import { typescriptField } from '../field/typescriptField'
import { typescriptLearningHintById, typescriptLearningHints } from './typescriptLearningHints'

describe('TypeScript learning hints', () => {
  it('hint idが一意でlookupと一致する', () => {
    expect(new Set(typescriptLearningHints.map((hint) => hint.id)).size).toBe(
      typescriptLearningHints.length,
    )

    for (const hint of typescriptLearningHints) {
      expect(typescriptLearningHintById[hint.id]).toBe(hint)
      expect(hint.codeLines.length).toBeGreaterThan(0)
      expect(hint.notes.length).toBeGreaterThan(0)
    }
  })

  it('TypeScript Fieldの全学習看板が存在するhintを参照する', () => {
    for (const interaction of typescriptField.interactions) {
      if (interaction.kind !== 'sign' || !('learningHintId' in interaction)) continue
      expect(typescriptLearningHintById[interaction.learningHintId], interaction.id).toBeDefined()
    }
  })
})
