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
  }
}
