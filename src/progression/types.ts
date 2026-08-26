export type PlayerInventory = {
  patchKit: number
}

export type PlayerProgress = {
  exp: number
  gold: number
  inventory: PlayerInventory
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
  goldReward?: number
  nextStageId?: number
  unlockSkillId?: string
  clearAreaId?: string
}

export type BattleVictoryReward = {
  expGained: number
  goldGained: number
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
