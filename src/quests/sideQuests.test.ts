import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import {
  applySideQuestVictory,
  getSideQuestProgressList,
  getSideQuestVictoryFeedback,
  sideQuests,
} from './quests'

describe('side quest progression', () => {
  it('Side Quest idと対象Battleは重複しない', () => {
    expect(new Set(sideQuests.map((quest) => quest.id)).size).toBe(sideQuests.length)
    expect(new Set(sideQuests.map((quest) => quest.targetBattleId)).size).toBe(sideQuests.length)
  })

  it('Area CLEAR前はLOCKEDで、CLEAR後にACTIVEになる', () => {
    const initial = createInitialPlayerProgress()
    const locked = getSideQuestProgressList(initial)

    expect(locked.find((entry) => entry.quest.id === 'javascript-second-pass')?.status).toBe(
      'locked',
    )
    expect(locked.find((entry) => entry.quest.id === 'typescript-type-recheck')?.status).toBe(
      'locked',
    )

    const afterJavaScriptClear = {
      ...initial,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    }
    const active = getSideQuestProgressList(afterJavaScriptClear)

    expect(active.find((entry) => entry.quest.id === 'javascript-second-pass')?.status).toBe(
      'active',
    )
    expect(active.find((entry) => entry.quest.id === 'typescript-type-recheck')?.status).toBe(
      'locked',
    )
  })

  it('JavaScript CLEAR後のStage 1再攻略で一度だけbonus EXPを付与する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 220,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    }

    const first = applySideQuestVictory(progress, 1)
    expect(first.reward).toEqual({
      questId: 'javascript-second-pass',
      questTitle: 'SECOND PASS',
      areaId: 'javascript',
      expGained: 40,
    })
    expect(first.progress.exp).toBe(260)
    expect(first.progress.completedSideQuestIds).toEqual(['javascript-second-pass'])
    expect(progress.exp).toBe(220)
    expect(progress.completedSideQuestIds).toEqual([])

    const replay = applySideQuestVictory(first.progress, 1)
    expect(replay.reward).toBeNull()
    expect(replay.progress.exp).toBe(260)
    expect(replay.progress.completedSideQuestIds).toEqual(['javascript-second-pass'])
  })

  it('対象外BattleではACTIVE Side Questを完了しない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 220,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    }

    const result = applySideQuestVictory(progress, 2)
    expect(result.reward).toBeNull()
    expect(result.progress).toBe(progress)
  })

  it('TypeScript Side QuestはJavaScriptと独立して完了する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 500,
      clearedStageIds: [1, 2, 3, 4, 5, 6],
      clearedAreaIds: ['javascript', 'typescript'],
      completedSideQuestIds: ['javascript-second-pass'],
    }

    const result = applySideQuestVictory(progress, 4)
    expect(result.reward?.questId).toBe('typescript-type-recheck')
    expect(result.reward?.expGained).toBe(50)
    expect(result.progress.completedSideQuestIds).toEqual([
      'javascript-second-pass',
      'typescript-type-recheck',
    ])
  })

  it('Side Quest完了差分からVictory feedbackを返す', () => {
    const before = {
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      completedSideQuestIds: [],
    }
    const after = {
      ...before,
      completedSideQuestIds: ['javascript-second-pass'],
    }

    expect(getSideQuestVictoryFeedback(before, after)).toEqual({
      kind: 'sideCompleted',
      questId: 'javascript-second-pass',
      areaId: 'javascript',
      questTitle: 'SECOND PASS',
      expGained: 40,
    })
    expect(getSideQuestVictoryFeedback(after, after)).toBeNull()
  })
})
