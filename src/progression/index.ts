export {
  BASE_PLAYER_HP,
  EXP_CURVE_FACTOR,
  HP_PER_LEVEL,
  POWER_MULTIPLIER_PER_LEVEL,
  addExp,
  createInitialPlayerProgress,
  getLevelForExp,
  getMaxHpForLevel,
  getPlayerStats,
  getPowerMultiplierForLevel,
  getTotalExpForLevel,
} from './progression'
export type { PlayerProgress, PlayerStats } from './types'
