import { describe, expect, it } from 'vitest'
import { javascriptField } from '../field/javascriptField'
import { learningHintById, learningHints } from './learningHints'

describe('learning hints', () => {
  it('idが一意でlookupと一致する', () => {
    expect(new Set(learningHints.map((hint) => hint.id)).size).toBe(learningHints.length)

    for (const hint of learningHints) {
      expect(learningHintById[hint.id]).toBe(hint)
    }
  })

  it('JavaScript Kingdomの基礎と追加構文を持つ', () => {
    expect(learningHints.map((hint) => hint.id)).toEqual(
      expect.arrayContaining([
        'js-find',
        'js-filter',
        'js-sort',
        'js-comparison',
        'js-and',
        'js-or',
        'js-some',
        'js-reduce',
      ]),
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

  it('Field上の学習看板が実在するヒントを参照する', () => {
    const learningSigns = javascriptField.interactions.filter(
      (interaction) => interaction.kind === 'sign' && 'learningHintId' in interaction,
    )

    expect(learningSigns).toHaveLength(8)
    for (const sign of learningSigns) {
      if (sign.kind !== 'sign' || !('learningHintId' in sign)) continue
      expect(learningHintById[sign.learningHintId]).toBeDefined()
    }
  })

  it('Field上の学習看板は同じ位置に重複しない', () => {
    const learningSigns = javascriptField.interactions.filter(
      (interaction) => interaction.kind === 'sign' && 'learningHintId' in interaction,
    )
    const positions = learningSigns.map((sign) => `${sign.x}:${sign.y}`)

    expect(new Set(positions).size).toBe(positions.length)
  })
})
