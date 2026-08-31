import type { Battle, Enemy } from './types'

const BOSS_GUARD_BATTLE_IDS = new Set([3, 6])

export const BOSS_GUARD_CONDITION_CODE =
  'enemies.some(e => e.role !== "boss" && e.hp > 0)'

export function hasBossGuard(battle: Pick<Battle, 'id' | 'isBoss'>): boolean {
  return battle.isBoss === true && BOSS_GUARD_BATTLE_IDS.has(battle.id)
}

export function isBossGuardActive(
  battle: Pick<Battle, 'id' | 'isBoss'>,
  enemies: readonly Enemy[],
): boolean {
  if (!hasBossGuard(battle)) return false
  return enemies.some((enemy) => enemy.role !== 'boss' && enemy.hp > 0)
}

export function resolveBossGuardDamage(
  battle: Pick<Battle, 'id' | 'isBoss'>,
  enemies: readonly Enemy[],
  target: Enemy,
  damage: number,
): number {
  const normalizedDamage = Math.max(0, damage)

  if (target.role !== 'boss' || !isBossGuardActive(battle, enemies)) {
    return normalizedDamage
  }

  return Math.min(normalizedDamage, 1)
}
