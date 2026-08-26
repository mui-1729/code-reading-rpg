import type { Enemy, EnemyInspectionValue, SkillCard } from '../game/types'

export type EnemyInspectionSnapshot = {
  base: readonly EnemyInspectionValue[]
  derived: readonly EnemyInspectionValue[]
}

const baseValue = (
  key: string,
  value: EnemyInspectionValue['value'],
): EnemyInspectionValue => ({ key, expression: `enemy.${key}`, value })

function getDerivedValues(enemy: Enemy, skill: SkillCard | null): readonly EnemyInspectionValue[] {
  if (!skill?.codeVariantId) return []

  if (
    skill.id === 'judge' &&
    (skill.codeVariantId === 'scored-short' || skill.codeVariantId === 'scored-enemy')
  ) {
    const alive = enemy.hp > 0
    const values: EnemyInspectionValue[] = [
      {
        key: 'in alive',
        expression: 'enemy.hp > 0',
        value: alive,
      },
    ]

    if (alive) {
      values.push({
        key: 'score',
        expression: 'enemy.attackDamage',
        value: enemy.attackDamage,
      })
    }

    return values
  }

  if (skill.id === 'moon-edge' && skill.codeVariantId === 'nested-safe') {
    const alive = enemy.hp > 0
    const values: EnemyInspectionValue[] = [
      {
        key: 'in alive',
        expression: 'enemy.hp > 0',
        value: alive,
      },
    ]

    if (alive) {
      values.push({
        key: 'stats.hp',
        expression: 'enemy.hp',
        value: enemy.hp,
      })
    }

    return values
  }

  return []
}

export function createEnemyInspectionSnapshot(
  enemy: Enemy,
  skill: SkillCard | null,
): EnemyInspectionSnapshot {
  return {
    base: [
      baseValue('id', enemy.id),
      baseValue('name', enemy.name),
      baseValue('hp', enemy.hp),
      baseValue('maxHp', enemy.maxHp),
      baseValue('attackName', enemy.attackName),
      baseValue('attackDamage', enemy.attackDamage),
    ],
    derived: getDerivedValues(enemy, skill),
  }
}
