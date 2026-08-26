export type PlayerProgress = {
  exp: number
  clearedStageIds: number[]
  clearedAreaIds: string[]
  completedSideQuestIds: string[]
  unlockedStageIds: number[]
  unlockedSkillIds: string[]
}

export type PlayerStats = {
  level: number
  maxHp: number
  powerMultiplier: number
}

export type BattleVictoryInput = {
  stageId: number
  expReward: number
  nextStageId?: number
  unlockSkillId?: string
  clearAreaId?: string
}

export type BattleVictoryReward = {
  expGained: number
  previousLevel: number
  newLevel: number
  firstClear: boolean
  unlockedStageId?: number
  unlockedSkillId?: string
  clearedAreaId?: string
}

export type BattleVictoryResult = {
  progress: PlayerProgress
  reward: BattleVictoryReward
}
