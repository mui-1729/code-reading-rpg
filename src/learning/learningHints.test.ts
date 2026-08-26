import { describe, expect, it } from 'vitest'
import { learningHintById, learningHints } from './learningHints'

describe('learning hints', () => {
  it('idが一意でlookupと一致する', () => {
    expect(new Set(learningHints.map((hint) => hint.id)).size).toBe(learningHints.length)

    for (const hint of learningHints) {
      expect(learningHintById[hint.id]).toBe(hint)
    }
  })

  it('JavaScript Kingdomの基礎4概念を持つ', () => {
    expect(learningHints.map((hint) => hint.id)).toEqual(
      expect.arrayContaining(['js-find', 'js-filter', 'js-sort', 'js-comparison']),
    )
  })

  it('各ヒントに説明・コード例・補足がある', () => {
    for (const hint of learningHints) {
      expect(hint.title.length).toBeGreaterThan(0)
      expect(hint.summary.length).toBeGreaterThan(0)
      expect(hint.codeLines.length).toBeGreaterThan(0)
      expect(hint.notes.length).toBeGreaterThan(0)
    }
  })
})
