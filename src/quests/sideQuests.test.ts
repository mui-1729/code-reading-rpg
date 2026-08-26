import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import {
  applySideQuestVictory,
  getSideQuestProgressList,
  getSideQuestVictoryFeedback,
  sideQuests,
} from './quests'

describe('simplified side quest behavior', () => {
  it('Side Questを公開しない', () => {
    expect(sideQuests).toEqual([])
    expect(getSideQuestProgressList(createInitialPlayerProgress())).toEqual([])
  })

  it('過去Battle再攻略でSide Quest bonusを付与しない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 220,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    }

    const result = applySideQuestVictory(progress, 1)
    expect(result.reward).toBeNull()
    expect(result.progress).toBe(progress)
    expect(result.progress.exp).toBe(220)
  })

  it('旧saveにSide Quest完了IDが残っていてもfeedbackを出さない', () => {
    const before = {
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      completedSideQuestIds: [],
    }
    const after = {
      ...before,
      completedSideQuestIds: ['javascript-second-pass'],
    }

    expect(getSideQuestVictoryFeedback(before, after)).toBeNull()
  })
})
