import type { Enemy, TargetRule } from './types'

export function getTargets(enemies: Enemy[], rule: TargetRule): Enemy[] {
  const alive = enemies.filter((enemy) => enemy.hp > 0)

  switch (rule.kind) {
    case 'firstBelow': {
      const target = alive.find((enemy) => enemy.hp < rule.hp)
      return target ? [target] : []
    }
    case 'allBelow':
      return alive.filter((enemy) => enemy.hp < rule.hp)
    case 'firstAbove': {
      const target = alive.find((enemy) => enemy.hp > rule.hp)
      return target ? [target] : []
    }
    case 'allAbove':
      return alive.filter((enemy) => enemy.hp > rule.hp)
    case 'named': {
      const target = alive.find((enemy) => enemy.name === rule.name)
      return target ? [target] : []
    }
    case 'lowestHp': {
      const target = [...alive].sort((a, b) => a.hp - b.hp)[0]
      return target ? [target] : []
    }
    case 'allBelowAndAttackAtLeast':
      return alive.filter(
        (enemy) => enemy.hp < rule.hp && enemy.attackDamage >= rule.attackDamage,
      )
    case 'firstAttackAtLeastOrAbove': {
      const target = alive.find(
        (enemy) => enemy.attackDamage >= rule.attackDamage || enemy.hp > rule.hp,
      )
      return target ? [target] : []
    }
    case 'allIfAnyBelow':
      return alive.some((enemy) => enemy.hp < rule.hp) ? alive : []
    case 'highestAttack': {
      const first = alive[0]
      if (!first) return []

      const target = alive.reduce((best, enemy) =>
        enemy.attackDamage > best.attackDamage ? enemy : best,
      )
      return [target]
    }
  }
}
