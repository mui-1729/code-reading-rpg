import type { CombatStats } from '../rpg/combat'
import { getIncomingDamage, getSkillDamage } from '../rpg/combat'
import { resolveBossGuardDamage } from './bossGuard'
import { getTargets } from './targeting'
import type { Battle, Enemy, SkillCard } from './types'

type BattleIdentity = Pick<Battle, 'id' | 'isBoss'>

export type PlayerActionResolution = {
  targets: Enemy[]
  enemies: Enemy[]
  skillDamage: number
  partyFollowUpDamage: number
  totalDamage: number
  damageByTargetId: Record<string, number>
  guardedBossTargeted: boolean
}

export type EnemyAttackResolution = {
  attackers: Array<{ enemy: Enemy; damage: number }>
  totalDamage: number
  playerHp: number
}

/** Pure turn calculation shared by the React runtime and the solvability search. */
export function resolvePlayerAction(input: {
  battle: BattleIdentity
  enemies: readonly Enemy[]
  skill: Pick<SkillCard, 'power' | 'rule'>
  playerStats: CombatStats
  partyFollowUpDamage?: number
}): PlayerActionResolution {
  const enemies = input.enemies.map((enemy) => ({ ...enemy }))
  const targets = getTargets(enemies, input.skill.rule)
  const skillDamage = getSkillDamage(input.skill.power, input.playerStats)
  const partyFollowUpDamage = Math.max(0, input.partyFollowUpDamage ?? 0)
  const totalDamage = skillDamage + partyFollowUpDamage
  const damageByTargetId = Object.fromEntries(
    targets.map((target) => [
      target.id,
      resolveBossGuardDamage(input.battle, enemies, target, totalDamage),
    ]),
  )
  const targetIds = new Set(targets.map((target) => target.id))
  const nextEnemies = enemies.map((enemy) =>
    targetIds.has(enemy.id)
      ? { ...enemy, hp: Math.max(0, enemy.hp - (damageByTargetId[enemy.id] ?? 0)) }
      : enemy,
  )

  return {
    targets,
    enemies: nextEnemies,
    skillDamage,
    partyFollowUpDamage,
    totalDamage,
    damageByTargetId,
    guardedBossTargeted: targets.some(
      (target) =>
        target.name === 'Boss' && (damageByTargetId[target.id] ?? totalDamage) < totalDamage,
    ),
  }
}

export function resolveEnemyAttack(input: {
  enemies: readonly Enemy[]
  playerHp: number
  defense: number
}): EnemyAttackResolution {
  const attackers = input.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => ({
      enemy: { ...enemy },
      damage: getIncomingDamage(enemy.attackDamage, input.defense),
    }))
  const totalDamage = attackers.reduce((total, attack) => total + attack.damage, 0)

  return {
    attackers,
    totalDamage,
    playerHp: Math.max(0, input.playerHp - totalDamage),
  }
}
