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
  partyFollowUpTargetId: string | null
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
  const skillDamageByTargetId = Object.fromEntries(
    targets.map((target) => [
      target.id,
      resolveBossGuardDamage(input.battle, enemies, target, skillDamage, input.skill),
    ]),
  )
  const targetIds = new Set(targets.map((target) => target.id))
  const enemiesAfterSkill = enemies.map((enemy) =>
    targetIds.has(enemy.id)
      ? { ...enemy, hp: Math.max(0, enemy.hp - (skillDamageByTargetId[enemy.id] ?? 0)) }
      : enemy,
  )
  // A party member performs one follow-up per player action, not one extra hit
  // per target. Prefer a selected target that survived the Skill so the hit is
  // observable; if every selected target fell, the follow-up is not emitted.
  const followUpTarget = partyFollowUpDamage > 0
    ? targets.find((target) =>
        (enemiesAfterSkill.find((enemy) => enemy.id === target.id)?.hp ?? 0) > 0,
      )
    : undefined
  const resolvedFollowUpDamage = followUpTarget
    ? resolveBossGuardDamage(
        input.battle,
        enemiesAfterSkill,
        followUpTarget,
        partyFollowUpDamage,
        input.skill,
      )
    : 0
  const damageByTargetId = Object.fromEntries(
    targets.map((target) => [
      target.id,
      (skillDamageByTargetId[target.id] ?? 0) +
        (target.id === followUpTarget?.id ? resolvedFollowUpDamage : 0),
    ]),
  )
  const nextEnemies = enemies.map((enemy) =>
    targetIds.has(enemy.id)
      ? { ...enemy, hp: Math.max(0, enemy.hp - (damageByTargetId[enemy.id] ?? 0)) }
      : enemy,
  )
  const totalDamage = Object.values(damageByTargetId).reduce(
    (total, damage) => total + damage,
    0,
  )

  return {
    targets,
    enemies: nextEnemies,
    skillDamage,
    partyFollowUpDamage: resolvedFollowUpDamage,
    partyFollowUpTargetId: followUpTarget?.id ?? null,
    totalDamage,
    damageByTargetId,
    guardedBossTargeted: targets.some(
      (target) =>
        target.role === 'boss' &&
        (skillDamageByTargetId[target.id] ?? skillDamage) < skillDamage,
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
