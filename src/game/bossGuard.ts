import type { Battle, Enemy, SkillCard } from './types'

const JAVASCRIPT_BOSS_ID = 3
const TYPESCRIPT_BOSS_ID = 6
const BOSS_GUARD_BATTLE_IDS = new Set([JAVASCRIPT_BOSS_ID, TYPESCRIPT_BOSS_ID])
const TYPESCRIPT_PIERCE_RULES = new Set<SkillCard['rule']['kind']>(['highestAttack', 'lowestHp'])

type BossGuardSkill = Pick<SkillCard, 'rule'>

export const BOSS_GUARD_CONDITION_CODE =
  'JS GUARD // minion alive · TS CONTRACT // NARROW JUDGE / KEY INDEX pierces'

export function hasBossGuard(battle: Pick<Battle, 'id' | 'isBoss'>): boolean {
  return battle.isBoss === true && BOSS_GUARD_BATTLE_IDS.has(battle.id)
}

export function isBossGuardActive(
  battle: Pick<Battle, 'id' | 'isBoss'>,
  enemies: readonly Enemy[],
): boolean {
  if (!hasBossGuard(battle)) return false

  if (battle.id === JAVASCRIPT_BOSS_ID) {
    return enemies.some((enemy) => enemy.role !== 'boss' && enemy.hp > 0)
  }

  if (battle.id === TYPESCRIPT_BOSS_ID) {
    return enemies.some((enemy) => enemy.role === 'boss' && enemy.hp > 0)
  }

  return false
}

export function canPierceBossGuard(
  battle: Pick<Battle, 'id' | 'isBoss'>,
  skill?: BossGuardSkill,
): boolean {
  return (
    battle.isBoss === true &&
    battle.id === TYPESCRIPT_BOSS_ID &&
    Boolean(skill && TYPESCRIPT_PIERCE_RULES.has(skill.rule.kind))
  )
}

export function resolveBossGuardDamage(
  battle: Pick<Battle, 'id' | 'isBoss'>,
  enemies: readonly Enemy[],
  target: Enemy,
  damage: number,
  skill?: BossGuardSkill,
): number {
  const normalizedDamage = Math.max(0, damage)

  if (target.role !== 'boss' || !isBossGuardActive(battle, enemies)) {
    return normalizedDamage
  }

  if (canPierceBossGuard(battle, skill)) {
    return normalizedDamage
  }

  return Math.min(normalizedDamage, 1)
}
