import { describe, expect, it } from 'vitest'
import { learningHints } from './learningHints'
import { typescriptLearningHints } from './typescriptLearningHints'

const allHints = [...learningHints, ...typescriptLearningHints]

describe('Code Codex source data', () => {
  it('JavaScript / TypeScriptを合わせてもhint idが重複しない', () => {
    expect(new Set(allHints.map((hint) => hint.id)).size).toBe(allHints.length)
  })

  it('Codexで表示する必須contentが空でない', () => {
    for (const hint of allHints) {
      expect(hint.concept.trim()).not.toBe('')
      expect(hint.title.trim()).not.toBe('')
      expect(hint.summary.trim()).not.toBe('')
      expect(hint.codeLines.length).toBeGreaterThan(0)
      expect(hint.codeLines.every((line) => line.trim().length > 0)).toBe(true)
      expect(hint.notes.length).toBeGreaterThan(0)
      expect(hint.notes.every((note) => note.trim().length > 0)).toBe(true)
    }
  })
})
