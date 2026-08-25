import { skills } from './skills'
import { getTargets } from './targeting'
import type { Battle, Enemy } from './types'

const PLAYER_MAX_HP = 100

export function hasInitialValidTarget(battle: Battle): boolean {
  return battle.skillIds.some((skillId) => {
    const skill = skills[skillId]
    return skill ? getTargets(battle.enemies, skill.rule).length > 0 : false
  })
}

export function isBattleSolvable(battle: Battle): boolean {
  const memo = new Map<string, boolean>()

  const search = (playerHp: number, enemies: Enemy[]): boolean => {
    if (enemies.every((enemy) => enemy.hp <= 0)) return true
    if (playerHp <= 0) return false

    const stateKey = `${playerHp}|${enemies.map((enemy) => enemy.hp).join(',')}`
    const cached = memo.get(stateKey)
    if (cached !== undefined) return cached

    for (const skillId of battle.skillIds) {
      const skill = skills[skillId]
      if (!skill) continue

      const targets = getTargets(enemies, skill.rule)
      const targetIds = new Set(targets.map((target) => target.id))
      const nextEnemies = enemies.map((enemy) =>
        targetIds.has(enemy.id)
          ? { ...enemy, hp: Math.max(0, enemy.hp - skill.power) }
          : enemy,
      )

      if (nextEnemies.every((enemy) => enemy.hp <= 0)) {
        memo.set(stateKey, true)
        return true
      }

      const incomingDamage = nextEnemies
        .filter((enemy) => enemy.hp > 0)
        .reduce((total, enemy) => total + enemy.attackDamage, 0)
      const nextPlayerHp = Math.max(0, playerHp - incomingDamage)

      if (nextPlayerHp > 0 && search(nextPlayerHp, nextEnemies)) {
        memo.set(stateKey, true)
        return true
      }
    }

    memo.set(stateKey, false)
    return false
  }

  return search(
    PLAYER_MAX_HP,
    battle.enemies.map((enemy) => ({ ...enemy })),
  )
}
