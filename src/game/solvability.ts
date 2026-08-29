import { skills } from './skills'
import { resolveEnemyAttack, resolvePlayerAction } from './combatTurn'
import { getTargets } from './targeting'
import type { Battle, Enemy } from './types'
import type { CombatStats } from '../rpg/combat'

const DEFAULT_COMBAT_STATS: CombatStats = {
  level: 1,
  maxHp: 100,
  powerMultiplier: 1,
  attack: 0,
  defense: 0,
}

export type SolvabilityProfile = {
  playerStats?: CombatStats
  initialPlayerHp?: number
  partyFollowUpDamage?: number
  patchKitCount?: number
  patchKitHeal?: number
}

export function hasInitialValidTarget(battle: Battle): boolean {
  return battle.skillIds.some((skillId) => {
    const skill = skills[skillId]
    return skill ? getTargets(battle.enemies, skill.rule).length > 0 : false
  })
}

export function isBattleSolvable(battle: Battle, profile: SolvabilityProfile = {}): boolean {
  const memo = new Map<string, boolean>()
  const playerStats = profile.playerStats ?? DEFAULT_COMBAT_STATS
  const initialPlayerHp = Math.max(
    0,
    Math.min(playerStats.maxHp, profile.initialPlayerHp ?? playerStats.maxHp),
  )
  const initialPatchKits = Math.max(0, Math.floor(profile.patchKitCount ?? 0))
  const patchKitHeal = Math.max(0, Math.floor(profile.patchKitHeal ?? 24))

  const search = (playerHp: number, enemies: Enemy[], patchKits: number): boolean => {
    if (enemies.every((enemy) => enemy.hp <= 0)) return true
    if (playerHp <= 0) return false

    const stateKey = `${playerHp}|${patchKits}|${enemies.map((enemy) => enemy.hp).join(',')}`
    const cached = memo.get(stateKey)
    if (cached !== undefined) return cached

    if (patchKits > 0 && playerHp < playerStats.maxHp && patchKitHeal > 0) {
      const healedHp = Math.min(playerStats.maxHp, playerHp + patchKitHeal)
      if (healedHp > playerHp && search(healedHp, enemies, patchKits - 1)) {
        memo.set(stateKey, true)
        return true
      }
    }

    for (const skillId of battle.skillIds) {
      const skill = skills[skillId]
      if (!skill) continue

      const playerAction = resolvePlayerAction({
        battle,
        enemies,
        skill,
        playerStats,
        partyFollowUpDamage: profile.partyFollowUpDamage,
      })
      const nextEnemies = playerAction.enemies

      if (nextEnemies.every((enemy) => enemy.hp <= 0)) {
        memo.set(stateKey, true)
        return true
      }

      const enemyAttack = resolveEnemyAttack({
        enemies: nextEnemies,
        playerHp,
        defense: playerStats.defense,
      })

      if (enemyAttack.playerHp > 0 && search(enemyAttack.playerHp, nextEnemies, patchKits)) {
        memo.set(stateKey, true)
        return true
      }
    }

    memo.set(stateKey, false)
    return false
  }

  return search(
    initialPlayerHp,
    battle.enemies.map((enemy) => ({ ...enemy })),
    initialPatchKits,
  )
}
