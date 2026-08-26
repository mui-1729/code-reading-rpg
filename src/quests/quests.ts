import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import type {
  QuestCondition,
  QuestDefinition,
  QuestProgress,
  QuestProgressSnapshot,
} from './types'

export const mainQuests: readonly QuestDefinition[] = [
  {
    id: 'javascript-main',
    areaId: JAVASCRIPT_AREA_ID,
    title: '王国のコード門を突破せよ',
    description: 'JavaScriptの配列処理を読み、3つのGateを越えてBossを倒す。',
    steps: [
      {
        id: 'javascript-stage-1',
        label: 'FIRST READ GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 1 },
      },
      {
        id: 'javascript-stage-2',
        label: 'ONE OR MANY GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 2 },
      },
      {
        id: 'javascript-area-clear',
        label: 'Bossを倒してJavaScript KingdomをAREA CLEARする',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
      },
    ],
  },
  {
    id: 'typescript-main',
    areaId: TYPESCRIPT_AREA_ID,
    title: 'Frontier Compilerを停止せよ',
    description: '型情報と実行時の条件を分けて読み、TypeScript Frontierを攻略する。',
    steps: [
      {
        id: 'typescript-stage-4',
        label: 'TYPED ENTRY GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 4 },
      },
      {
        id: 'typescript-stage-5',
        label: 'MAYBE VALUE GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 5 },
      },
      {
        id: 'typescript-area-clear',
        label: 'Frontier Compilerを倒してTypeScript FrontierをAREA CLEARする',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
      },
    ],
  },
]

export function matchesQuestCondition(
  condition: QuestCondition,
  progress: QuestProgressSnapshot,
): boolean {
  if (condition.kind === 'stageCleared') {
    return progress.clearedStageIds.includes(condition.stageId)
  }

  return progress.clearedAreaIds.includes(condition.areaId)
}

export function getQuestProgress(
  quest: QuestDefinition,
  progress: QuestProgressSnapshot,
): QuestProgress {
  if (quest.unlockWhen && !matchesQuestCondition(quest.unlockWhen, progress)) {
    return {
      quest,
      status: 'locked',
      completedSteps: 0,
      totalSteps: quest.steps.length,
      nextStep: quest.steps[0],
    }
  }

  const completedSteps = quest.steps.filter((step) =>
    matchesQuestCondition(step.condition, progress),
  ).length
  const nextStep = quest.steps.find((step) => !matchesQuestCondition(step.condition, progress))

  return {
    quest,
    status: completedSteps === quest.steps.length ? 'complete' : 'active',
    completedSteps,
    totalSteps: quest.steps.length,
    nextStep,
  }
}

export function getMainQuestProgress(progress: QuestProgressSnapshot): QuestProgress[] {
  return mainQuests.map((quest) => getQuestProgress(quest, progress))
}
