import type { Enemy } from './types'

export const BOSS_GUARD_CODE = 'enemies.some(e => e.name !== "Boss" && e.hp > 0)'

export function isBossGuardActive(enemies: readonly Enemy[], isBossBattle: boolean): boolean {
  if (!isBossBattle) return false
  return enemies.some((enemy) => enemy.name !== 'Boss' && enemy.hp > 0)
}

export function getBossGuardedDamage(
  enemy: Enemy,
  damage: number,
  enemies: readonly Enemy[],
  isBossBattle: boolean,
): number {
  const normalizedDamage = Math.max(0, Math.floor(damage))
  if (enemy.name !== 'Boss' || !isBossGuardActive(enemies, isBossBattle)) {
    return normalizedDamage
  }
  return Math.min(1, normalizedDamage)
}
