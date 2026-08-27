import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import { addExp, type PlayerProgress } from '../progression'
import type {
  QuestCondition,
  QuestDefinition,
  QuestFieldFocus,
  QuestProgress,
  QuestProgressSnapshot,
  QuestVictoryFeedback,
  SideQuestDefinition,
  SideQuestProgress,
  SideQuestProgressSnapshot,
  SideQuestVictoryFeedback,
  SideQuestVictoryResult,
} from './types'

export const mainQuests: readonly QuestDefinition[] = [
  {
    id: 'javascript-main',
    areaId: JAVASCRIPT_AREA_ID,
    title: '新人エンジニアの初仕事',
    description: 'Issue対応、QA triage、本番障害対応を通してJavaScriptのコードリーディングを身につける。',
    guideNpcId: 'archivist',
    steps: [
      {
        id: 'javascript-stage-1',
        label: 'Issue #101を調査し、誤った対象を選ぶbugの原因を特定する',
        condition: { kind: 'stageCleared', stageId: 1 },
        fieldTarget: { kind: 'battle', stageId: 1 },
      },
      {
        id: 'javascript-stage-2',
        label: 'QAから届いた複数reportをtriageし、影響範囲を特定する',
        condition: { kind: 'stageCleared', stageId: 2 },
        fieldTarget: { kind: 'battle', stageId: 2 },
      },
      {
        id: 'javascript-area-clear',
        label: 'SEV-1 Production Incidentの原因を特定し、serviceを復旧する',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        fieldTarget: { kind: 'battle', stageId: 3 },
      },
    ],
  },
  {
    id: 'typescript-main',
    areaId: TYPESCRIPT_AREA_ID,
    title: 'Frontier Compilerを停止せよ',
    description: '型情報と実行時の条件を分けて読み、TypeScript Frontierを攻略する。',
    guideNpcId: 'type-warden',
    steps: [
      {
        id: 'typescript-stage-4',
        label: 'TYPED ENTRY GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 4 },
        fieldTarget: { kind: 'battle', stageId: 4 },
      },
      {
        id: 'typescript-stage-5',
        label: 'MAYBE VALUE GATEをCLEARする',
        condition: { kind: 'stageCleared', stageId: 5 },
        fieldTarget: { kind: 'battle', stageId: 5 },
      },
      {
        id: 'typescript-area-clear',
        label: 'Frontier Compilerを倒してTypeScript FrontierをAREA CLEARする',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        fieldTarget: { kind: 'battle', stageId: 6 },
      },
    ],
  },
]

// The simplified game loop has no Side Quest layer. Keep the generic helpers so old
// save data remains compatible, but expose no active Side Quest definitions.
export const sideQuests: readonly SideQuestDefinition[] = []

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

export function getSideQuestProgress(
  quest: SideQuestDefinition,
  progress: SideQuestProgressSnapshot,
): SideQuestProgress {
  if (progress.completedSideQuestIds.includes(quest.id)) {
    return { quest, status: 'complete' }
  }

  if (!matchesQuestCondition(quest.unlockWhen, progress)) {
    return { quest, status: 'locked' }
  }

  return { quest, status: 'active' }
}

export function getSideQuestProgressList(
  progress: SideQuestProgressSnapshot,
): SideQuestProgress[] {
  return sideQuests.map((quest) => getSideQuestProgress(quest, progress))
}

export function applySideQuestVictory(
  progress: PlayerProgress,
  battleId: number,
): SideQuestVictoryResult {
  const quest = sideQuests.find(
    (candidate) =>
      candidate.targetBattleId === battleId &&
      getSideQuestProgress(candidate, progress).status === 'active',
  )

  if (!quest) {
    return { progress, reward: null }
  }

  const next = addExp(progress, quest.expReward)
  next.completedSideQuestIds = [...next.completedSideQuestIds, quest.id]

  return {
    progress: next,
    reward: {
      questId: quest.id,
      questTitle: quest.title,
      areaId: quest.areaId,
      expGained: quest.expReward,
    },
  }
}

export function getActiveQuestFieldFocus(
  areaId: string,
  progress: QuestProgressSnapshot,
): QuestFieldFocus | null {
  const quest = mainQuests.find((candidate) => candidate.areaId === areaId)
  if (!quest) return null

  const questProgress = getQuestProgress(quest, progress)
  if (questProgress.status !== 'active') return null

  return {
    stageId: questProgress.nextStep?.fieldTarget?.stageId,
    guideNpcId: quest.guideNpcId,
  }
}

export function getQuestVictoryFeedback(
  before: QuestProgressSnapshot,
  after: QuestProgressSnapshot,
): QuestVictoryFeedback | null {
  for (const quest of mainQuests) {
    const newlyCompletedSteps = quest.steps.filter(
      (step) =>
        !matchesQuestCondition(step.condition, before) &&
        matchesQuestCondition(step.condition, after),
    )

    if (newlyCompletedSteps.length === 0) continue

    const afterProgress = getQuestProgress(quest, after)
    const completedStep = newlyCompletedSteps[newlyCompletedSteps.length - 1]

    return {
      kind: afterProgress.status === 'complete' ? 'completed' : 'updated',
      questId: quest.id,
      areaId: quest.areaId,
      questTitle: quest.title,
      completedStepLabel: completedStep.label,
      nextStepLabel: afterProgress.nextStep?.label,
    }
  }

  return null
}

export function getSideQuestVictoryFeedback(
  before: SideQuestProgressSnapshot,
  after: SideQuestProgressSnapshot,
): SideQuestVictoryFeedback | null {
  const completedQuest = sideQuests.find(
    (quest) =>
      !before.completedSideQuestIds.includes(quest.id) &&
      after.completedSideQuestIds.includes(quest.id),
  )

  if (!completedQuest) return null

  return {
    kind: 'sideCompleted',
    questId: completedQuest.id,
    areaId: completedQuest.areaId,
    questTitle: completedQuest.title,
    expGained: completedQuest.expReward,
  }
}
