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
