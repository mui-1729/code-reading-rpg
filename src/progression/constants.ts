export const BASE_PLAYER_HP = 100
export const HP_PER_LEVEL = 8
export const POWER_MULTIPLIER_PER_LEVEL = 0.02
export const EXP_CURVE_FACTOR = 20

// Canonical progression starts by reproducing the live JavaScript incident.
// Later entries are derived from semantic progressionGraph prerequisites.
export const DEFAULT_INITIAL_STAGE_IDS = [1] as const
export const DEFAULT_INITIAL_SKILL_IDS = [
  'trace',
  'pulse',
  'nova',
  'ts-scan',
  'ts-guard',
  'ts-label',
] as const
