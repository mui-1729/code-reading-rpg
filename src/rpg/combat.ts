import type { PlayerStats } from '../progression'
import { getEquipmentBonuses } from './equipment'
import type { RpgState } from './state'

export type CombatStats = PlayerStats & {
  attack: number
  defense: number
}

export function getCombatStats(baseStats: PlayerStats, rpgState: RpgState): CombatStats {
  const bonuses = getEquipmentBonuses(rpgState.equipment)
  return {
    ...baseStats,
    maxHp: baseStats.maxHp + bonuses.maxHp,
    attack: 10 + (baseStats.level - 1) * 2 + bonuses.attack,
    defense: 3 + (baseStats.level - 1) + bonuses.defense,
  }
}

export function getSkillDamage(basePower: number, stats: CombatStats): number {
  const normalizedPower = Math.max(0, basePower)
  return Math.max(0, Math.round(normalizedPower * stats.powerMultiplier + stats.attack * 0.35))
}

export function getIncomingDamage(rawDamage: number, defense: number): number {
  const mitigation = Math.max(0, Math.floor(defense / 3))
  return Math.max(1, Math.max(0, Math.floor(rawDamage)) - mitigation)
}
