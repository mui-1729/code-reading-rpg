import { describe, expect, it } from 'vitest'
import {
  getActiveQuestFieldFocus,
  getMainQuestProgress,
  getQuestProgress,
  getQuestVictoryFeedback,
  matchesQuestCondition,
} from './quests'
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

  it('Field focusはJavaScriptの次GateとObjective Guideを進行に合わせて返す', () => {
    expect(getActiveQuestFieldFocus('javascript', emptyProgress)).toEqual({
      stageId: 1,
      guideNpcId: 'archivist',
    })
    expect(
      getActiveQuestFieldFocus('javascript', { ...emptyProgress, clearedStageIds: [1] }),
    ).toEqual({ stageId: 2, guideNpcId: 'archivist' })
    expect(
      getActiveQuestFieldFocus('javascript', { ...emptyProgress, clearedStageIds: [1, 2] }),
    ).toEqual({ stageId: 3, guideNpcId: 'archivist' })
    expect(
      getActiveQuestFieldFocus('javascript', {
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
      }),
    ).toBeNull()
  })

  it('Field focusはTypeScriptでもStage 4→5→6へ切り替わる', () => {
    expect(getActiveQuestFieldFocus('typescript', emptyProgress)?.stageId).toBe(4)
    expect(
      getActiveQuestFieldFocus('typescript', { ...emptyProgress, clearedStageIds: [4] })?.stageId,
    ).toBe(5)
    expect(
      getActiveQuestFieldFocus('typescript', { ...emptyProgress, clearedStageIds: [4, 5] })?.stageId,
    ).toBe(6)
    expect(
      getActiveQuestFieldFocus('typescript', {
        clearedStageIds: [4, 5, 6],
        clearedAreaIds: ['typescript'],
      }),
    ).toBeNull()
  })

  it('初回Stage CLEARではQUEST UPDATEDと次の目的を返す', () => {
    expect(
      getQuestVictoryFeedback(emptyProgress, {
        ...emptyProgress,
        clearedStageIds: [1],
      }),
    ).toEqual({
      kind: 'updated',
      questId: 'javascript-main',
      areaId: 'javascript',
      questTitle: 'JavaScript王国を救え',
      completedStepLabel: '西の草原の魔物を倒し、異変の手がかりを見つける',
      nextStepLabel: '暴走する魔物を退け、黒い結晶の痕跡を西の砦まで追う',
    })
  })

  it('Boss CLEARでMAIN QUEST COMPLETEを返す', () => {
    expect(
      getQuestVictoryFeedback(
        { clearedStageIds: [1, 2], clearedAreaIds: [] },
        { clearedStageIds: [1, 2, 3], clearedAreaIds: ['javascript'] },
      ),
    ).toEqual({
      kind: 'completed',
      questId: 'javascript-main',
      areaId: 'javascript',
      questTitle: 'JavaScript王国を救え',
      completedStepLabel: '西の砦のBossを倒し、Code Crystalを取り戻す',
      nextStepLabel: undefined,
    })
  })

  it('TypeScript Stage CLEARでも次の目的を返す', () => {
    expect(
      getQuestVictoryFeedback(
        { clearedStageIds: [1, 2, 3], clearedAreaIds: ['javascript'] },
        { clearedStageIds: [1, 2, 3, 4], clearedAreaIds: ['javascript'] },
      ),
    ).toMatchObject({
      kind: 'updated',
      questId: 'typescript-main',
      nextStepLabel: 'MAYBE VALUE GATEをCLEARする',
    })
  })

  it('replay勝利のようにQuest条件が変化しなければfeedbackを返さない', () => {
    const before = { clearedStageIds: [1], clearedAreaIds: [] }
    const after = { clearedStageIds: [1], clearedAreaIds: [] }
    expect(getQuestVictoryFeedback(before, after)).toBeNull()
  })
})
