import type { PlayerProgress, PlayerStats } from './types'

export const BASE_PLAYER_HP = 100
export const HP_PER_LEVEL = 8
export const POWER_MULTIPLIER_PER_LEVEL = 0.02
export const EXP_CURVE_FACTOR = 20

const DEFAULT_INITIAL_SKILL_IDS = ['trace', 'pulse', 'nova'] as const

export function createInitialPlayerProgress(): PlayerProgress {
  return {
    exp: 0,
    clearedStageIds: [],
    unlockedStageIds: [1],
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
