import {
  BASE_PLAYER_HP,
  DEFAULT_INITIAL_SKILL_IDS,
  DEFAULT_INITIAL_STAGE_IDS,
  EXP_CURVE_CUBIC_FACTOR,
  EXP_CURVE_LINEAR_FACTOR,
  EXP_CURVE_QUADRATIC_FACTOR,
  HP_PER_LEVEL,
  POWER_MULTIPLIER_PER_LEVEL,
} from './constants'
import { getCanonicalUnlockedStageIds } from './progressionGraph'
import { getMasteredSkillIds } from './skillMastery'
import type {
  BattleVictoryInput,
  BattleVictoryResult,
  PlayerProgress,
  PlayerStats,
} from './types'

export const REPLAY_GOLD_MULTIPLIER = 0.5

export function createInitialPlayerProgress(): PlayerProgress {
  return {
    exp: 0,
    gold: 0,
    inventory: { patchKit: 0 },
    clearedStageIds: [],
    clearedAreaIds: [],
    completedSideQuestIds: [],
    unlockedStageIds: [...DEFAULT_INITIAL_STAGE_IDS],
    unlockedSkillIds: [...DEFAULT_INITIAL_SKILL_IDS],
  }
}

export function getTotalExpForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  const completedLevels = normalizedLevel - 1

  return (
    EXP_CURVE_CUBIC_FACTOR * completedLevels ** 3 +
    EXP_CURVE_QUADRATIC_FACTOR * completedLevels ** 2 +
    EXP_CURVE_LINEAR_FACTOR * completedLevels
  )
}

export function getLevelForExp(exp: number): number {
  const normalizedExp = Math.max(0, exp)
  const cubicEstimate = Math.floor(
    Math.cbrt(normalizedExp / EXP_CURVE_CUBIC_FACTOR),
  )
  let low = 1
  let high = Math.max(2, cubicEstimate + 2)

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (getTotalExpForLevel(middle) <= normalizedExp) {
      low = middle
    } else {
      high = middle - 1
    }
  }

  return low
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

export function getBattleGoldReward(goldReward: number, firstClear: boolean): number {
  const normalizedReward = Math.max(0, Math.floor(goldReward))
  return firstClear
    ? normalizedReward
    : Math.floor(normalizedReward * REPLAY_GOLD_MULTIPLIER)
}

export function applyBattleVictory(
  progress: PlayerProgress,
  input: BattleVictoryInput,
): BattleVictoryResult {
  const previousLevel = getLevelForExp(progress.exp)
  // EXP is deliberately not reduced on replay. The steeper level curve makes
  // early grinding progressively inefficient without forbidding it as an RPG playstyle.
  const expGained = Math.max(0, input.expReward)
  const firstClear = !progress.clearedStageIds.includes(input.stageId)
  const goldGained = getBattleGoldReward(input.goldReward ?? 0, firstClear)
  const next = {
    ...addExp(progress, expGained),
    gold: progress.gold + goldGained,
    inventory: { ...progress.inventory },
  }

  let unlockedStageId: number | undefined
  let unlockedSkillId: string | undefined
  let clearedAreaId: string | undefined

  if (firstClear) {
    next.clearedStageIds = [...next.clearedStageIds, input.stageId]
  }

  const beforeCanonicalUnlocks = new Set(getCanonicalUnlockedStageIds(progress.clearedStageIds))
  const canonicalUnlocks = getCanonicalUnlockedStageIds(next.clearedStageIds)
  const newlyUnlocked = canonicalUnlocks.filter(
    (battleId) =>
      !beforeCanonicalUnlocks.has(battleId) &&
      !next.clearedStageIds.includes(battleId),
  )
  next.unlockedStageIds = canonicalUnlocks

  if (firstClear) {
    unlockedStageId =
      input.nextStageId && newlyUnlocked.includes(input.nextStageId)
        ? input.nextStageId
        : newlyUnlocked[0]
  }

  const beforeMasteredSkills = new Set(getMasteredSkillIds(progress.clearedStageIds))
  next.unlockedSkillIds = getMasteredSkillIds(next.clearedStageIds)
  if (firstClear) {
    unlockedSkillId = next.unlockedSkillIds.find((skillId) => !beforeMasteredSkills.has(skillId))
  }

  if (firstClear && input.clearAreaId && !next.clearedAreaIds.includes(input.clearAreaId)) {
    next.clearedAreaIds = [...next.clearedAreaIds, input.clearAreaId]
    clearedAreaId = input.clearAreaId
  }

  return {
    progress: next,
    reward: {
      expGained,
      goldGained,
      previousLevel,
      newLevel: getLevelForExp(next.exp),
      firstClear,
      unlockedStageId,
      unlockedSkillId,
      clearedAreaId,
    },
  }
}
