export type QuestProgressSnapshot = {
  clearedStageIds: number[]
  clearedAreaIds: string[]
}

export type QuestCondition =
  | { kind: 'stageCleared'; stageId: number }
  | { kind: 'areaCleared'; areaId: string }

export type QuestStep = {
  id: string
  label: string
  condition: QuestCondition
}

export type QuestDefinition = {
  id: string
  areaId: string
  title: string
  description: string
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
