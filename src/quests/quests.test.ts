import { describe, expect, it } from 'vitest'
import { getMainQuestProgress, getQuestProgress, matchesQuestCondition } from './quests'
import type { QuestDefinition, QuestProgressSnapshot } from './types'

const emptyProgress: QuestProgressSnapshot = {
  clearedStageIds: [],
  clearedAreaIds: [],
}

describe('quest progression', () => {
  it('Stage CLEAR / Area CLEAR条件を評価する', () => {
    expect(matchesQuestCondition({ kind: 'stageCleared', stageId: 1 }, emptyProgress)).toBe(false)
    expect(
      matchesQuestCondition(
        { kind: 'stageCleared', stageId: 1 },
        { ...emptyProgress, clearedStageIds: [1] },
      ),
    ).toBe(true)
    expect(
      matchesQuestCondition(
        { kind: 'areaCleared', areaId: 'javascript' },
        { ...emptyProgress, clearedAreaIds: ['javascript'] },
      ),
    ).toBe(true)
  })

  it('JavaScript Main QuestはStage進行に合わせてnext stepを切り替える', () => {
    const initial = getMainQuestProgress(emptyProgress)[0]
    expect(initial.status).toBe('active')
    expect(initial.completedSteps).toBe(0)
    expect(initial.nextStep?.id).toBe('javascript-stage-1')

    const afterStage1 = getMainQuestProgress({
      ...emptyProgress,
      clearedStageIds: [1],
    })[0]
    expect(afterStage1.completedSteps).toBe(1)
    expect(afterStage1.nextStep?.id).toBe('javascript-stage-2')

    const complete = getMainQuestProgress({
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    })[0]
    expect(complete.status).toBe('complete')
    expect(complete.completedSteps).toBe(3)
    expect(complete.nextStep).toBeUndefined()
  })

  it('TypeScript Main QuestはJavaScript進行と独立して進む', () => {
    const quests = getMainQuestProgress({
      clearedStageIds: [4],
      clearedAreaIds: [],
    })
    const javascriptQuest = quests.find((quest) => quest.quest.id === 'javascript-main')
    const typescriptQuest = quests.find((quest) => quest.quest.id === 'typescript-main')

    expect(javascriptQuest?.completedSteps).toBe(0)
    expect(typescriptQuest?.completedSteps).toBe(1)
    expect(typescriptQuest?.nextStep?.id).toBe('typescript-stage-5')
  })

  it('unlock条件を持つQuestは条件成立までLOCKEDになる', () => {
    const lockedQuest: QuestDefinition = {
      id: 'locked-example',
      areaId: 'example',
      title: 'Locked',
      description: 'test',
      unlockWhen: { kind: 'stageCleared', stageId: 9 },
      steps: [
        {
          id: 'locked-step',
          label: 'step',
          condition: { kind: 'areaCleared', areaId: 'example' },
        },
      ],
    }

    expect(getQuestProgress(lockedQuest, emptyProgress).status).toBe('locked')
    expect(
      getQuestProgress(lockedQuest, { ...emptyProgress, clearedStageIds: [9] }).status,
    ).toBe('active')
  })
})
