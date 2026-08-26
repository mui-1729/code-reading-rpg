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
