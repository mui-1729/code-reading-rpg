import {
  BASE_PLAYER_HP,
  DEFAULT_INITIAL_SKILL_IDS,
  DEFAULT_INITIAL_STAGE_IDS,
  EXP_CURVE_FACTOR,
  HP_PER_LEVEL,
  POWER_MULTIPLIER_PER_LEVEL,
} from './constants'
import type {
  BattleVictoryInput,
  BattleVictoryResult,
  PlayerProgress,
  PlayerStats,
} from './types'

export function createInitialPlayerProgress(): PlayerProgress {
  return {
    exp: 0,
    clearedStageIds: [],
    clearedAreaIds: [],
    completedSideQuestIds: [],
    unlockedStageIds: [...DEFAULT_INITIAL_STAGE_IDS],
    unlockedSkillIds: [...DEFAULT_INITIAL_SKILL_IDS],
  }
}

export function getTotalExpForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  return EXP_CURVE_FACTOR * normalizedLevel * (normalizedLevel - 1)
}

export function getLevelForExp(exp: number): number {
  const normalizedExp = Math.max(0, exp)
  const discriminant = 1 + (4 * normalizedExp) / EXP_CURVE_FACTOR
  return Math.max(1, Math.floor((1 + Math.sqrt(discriminant)) / 2))
}

export function getMaxHpForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  return BASE_PLAYER_HP + (normalizedLevel - 1) * HP_PER_LEVEL
}

export function getPowerMultiplierForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  return 1 + (normalizedLevel - 1) * POWER_MULTIPLIER_PER_LEVEL
}

export function getSkillPowerForLevel(basePower: number, level: number): number {
  const normalizedPower = Math.max(0, basePower)
  return Math.round(normalizedPower * getPowerMultiplierForLevel(level))
}

export function getPlayerStats(exp: number): PlayerStats {
  const level = getLevelForExp(exp)

  return {
    level,
    maxHp: getMaxHpForLevel(level),
    powerMultiplier: getPowerMultiplierForLevel(level),
  }
}

export function addExp(progress: PlayerProgress, amount: number): PlayerProgress {
  return {
    ...progress,
    exp: Math.max(0, progress.exp + Math.max(0, amount)),
  }
}

export function applyBattleVictory(
  progress: PlayerProgress,
  input: BattleVictoryInput,
): BattleVictoryResult {
  const previousLevel = getLevelForExp(progress.exp)
  const expGained = Math.max(0, input.expReward)
  const firstClear = !progress.clearedStageIds.includes(input.stageId)
  const next = addExp(progress, expGained)

  let unlockedStageId: number | undefined
  let unlockedSkillId: string | undefined
  let clearedAreaId: string | undefined

  if (firstClear && input.nextStageId && !next.unlockedStageIds.includes(input.nextStageId)) {
    next.unlockedStageIds = [...next.unlockedStageIds, input.nextStageId]
    unlockedStageId = input.nextStageId
  }

  if (firstClear && input.unlockSkillId && !next.unlockedSkillIds.includes(input.unlockSkillId)) {
    next.unlockedSkillIds = [...next.unlockedSkillIds, input.unlockSkillId]
    unlockedSkillId = input.unlockSkillId
  }

  if (firstClear && input.clearAreaId && !next.clearedAreaIds.includes(input.clearAreaId)) {
    next.clearedAreaIds = [...next.clearedAreaIds, input.clearAreaId]
    clearedAreaId = input.clearAreaId
  }

  if (firstClear) {
    next.clearedStageIds = [...next.clearedStageIds, input.stageId]
  }

  return {
    progress: next,
    reward: {
      expGained,
      previousLevel,
      newLevel: getLevelForExp(next.exp),
      firstClear,
      unlockedStageId,
      unlockedSkillId,
      clearedAreaId,
    },
  }
}
