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
  /** All Skills that became MASTERED from this clear. */
  unlockedSkillIds?: string[]
  /** First newly MASTERED Skill, kept for existing single-unlock presentation/SE callers. */
  unlockedSkillId?: string
  clearedAreaId?: string
}

export type BattleVictoryResult = {
  progress: PlayerProgress
  reward: BattleVictoryReward
}
