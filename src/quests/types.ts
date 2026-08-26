import type { PlayerProgress } from '../progression/types'

export type QuestProgressSnapshot = {
  clearedStageIds: number[]
  clearedAreaIds: string[]
}

export type QuestCondition =
  | { kind: 'stageCleared'; stageId: number }
  | { kind: 'areaCleared'; areaId: string }

export type QuestFieldTarget = {
  kind: 'battle'
  stageId: number
}

export type QuestStep = {
  id: string
  label: string
  condition: QuestCondition
  fieldTarget?: QuestFieldTarget
}

export type QuestDefinition = {
  id: string
  areaId: string
  title: string
  description: string
  guideNpcId?: string
  unlockWhen?: QuestCondition
  steps: QuestStep[]
}

export type QuestStatus = 'locked' | 'active' | 'complete'

export type QuestProgress = {
  quest: QuestDefinition
  status: QuestStatus
  completedSteps: number
  totalSteps: number
  nextStep?: QuestStep
}

export type QuestFieldFocus = {
  stageId?: number
  guideNpcId?: string
}

export type QuestVictoryFeedback = {
  kind: 'updated' | 'completed'
  questId: string
  areaId: string
  questTitle: string
  completedStepLabel: string
  nextStepLabel?: string
}

export type SideQuestProgressSnapshot = QuestProgressSnapshot & {
  completedSideQuestIds: string[]
}

export type SideQuestDefinition = {
  id: string
  areaId: string
  title: string
  objective: string
  unlockWhen: QuestCondition
  targetBattleId: number
  expReward: number
}

export type SideQuestProgress = {
  quest: SideQuestDefinition
  status: QuestStatus
}

export type SideQuestVictoryReward = {
  questId: string
  questTitle: string
  areaId: string
  expGained: number
}

export type SideQuestVictoryResult = {
  progress: PlayerProgress
  reward: SideQuestVictoryReward | null
}

export type SideQuestVictoryFeedback = {
  kind: 'sideCompleted'
  questId: string
  areaId: string
  questTitle: string
  expGained: number
}
