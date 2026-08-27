import type { Battle, Enemy } from './types'

export const BOSS_GUARD_CODE = 'enemies.some(e => e.name !== "Boss" && e.hp > 0)'

export type BossGuardDamageResult = {
  damage: number
  guarded: boolean
}

export function isBossEnemy(enemy: Enemy): boolean {
  return enemy.name === 'Boss'
}

export function isBossGuardActive(battle: Pick<Battle, 'isBoss'>, enemies: readonly Enemy[]): boolean {
  if (!battle.isBoss) return false
  return enemies.some((enemy) => !isBossEnemy(enemy) && enemy.hp > 0)
}

export function resolveBossGuardDamage(
  battle: Pick<Battle, 'isBoss'>,
  enemies: readonly Enemy[],
  target: Enemy,
  damage: number,
): BossGuardDamageResult {
  const normalizedDamage = Math.max(0, Math.floor(damage))
  const guarded = isBossEnemy(target) && isBossGuardActive(battle, enemies)

  return {
    guarded,
    damage: guarded && normalizedDamage > 0 ? 1 : normalizedDamage,
  }
}
