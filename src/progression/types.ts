export type PlayerProgress = {
  exp: number
  clearedStageIds: number[]
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
}

export type BattleVictoryReward = {
  expGained: number
  previousLevel: number
  newLevel: number
  firstClear: boolean
  unlockedStageId?: number
  unlockedSkillId?: string
}

export type BattleVictoryResult = {
  progress: PlayerProgress
  reward: BattleVictoryReward
}
