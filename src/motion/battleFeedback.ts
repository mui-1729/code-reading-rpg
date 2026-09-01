import type { Enemy, TargetRule } from '../game/types'

export type BattleSemanticFamily =
  | 'first-match'
  | 'multi-match'
  | 'gate-any'
  | 'gate-every'
  | 'ordered'
  | 'reduced'

export type BattleSemanticFeedback = {
  family: BattleSemanticFamily
  label: string
  detail: string
  tracedEnemyIds: string[]
  targetEnemyIds: string[]
}

const aliveEnemies = (enemies: readonly Enemy[]) => enemies.filter((enemy) => enemy.hp > 0)

const firstMatchKinds = new Set<TargetRule['kind']>([
  'firstBelow',
  'firstAbove',
  'firstAboveAndNamed',
  'firstAttackAtLeastOrAbove',
  'firstBelowOrAbove',
  'named',
])

const multiMatchKinds = new Set<TargetRule['kind']>([
  'allBelow',
  'allAbove',
  'allBelowAndAttackAtLeast',
])

export function getBattleSemanticFeedback(
  rule: TargetRule,
  enemies: readonly Enemy[],
  targets: readonly Enemy[],
): BattleSemanticFeedback {
  const alive = aliveEnemies(enemies)
  const targetEnemyIds = targets.map((target) => target.id)
  const firstTarget = targets[0]

  if (firstMatchKinds.has(rule.kind)) {
    const stopIndex = firstTarget
      ? alive.findIndex((enemy) => enemy.id === firstTarget.id)
      : alive.length - 1
    return {
      family: 'first-match',
      label: 'FIRST MATCH',
      detail: firstTarget
        ? `前から確認 → ${firstTarget.name}で停止`
        : '最後まで確認 → MATCHなし',
      tracedEnemyIds: alive.slice(0, Math.max(0, stopIndex) + 1).map((enemy) => enemy.id),
      targetEnemyIds,
    }
  }

  if (multiMatchKinds.has(rule.kind)) {
    return {
      family: 'multi-match',
      label: 'FILTERED GROUP',
      detail: `${targetEnemyIds.length} / ${alive.length}体が条件を通過`,
      tracedEnemyIds: alive.map((enemy) => enemy.id),
      targetEnemyIds,
    }
  }

  if (rule.kind === 'allIfAnyBelow') {
    return {
      family: 'gate-any',
      label: 'ANY GATE',
      detail: targets.length > 0 ? '条件を満たす敵を発見 → group effect ON' : '条件を満たす敵なし → OFF',
      tracedEnemyIds: alive.map((enemy) => enemy.id),
      targetEnemyIds,
    }
  }

  if (rule.kind === 'allIfEveryBelow') {
    return {
      family: 'gate-every',
      label: 'EVERY GATE',
      detail: targets.length > 0 ? '全員が条件を通過 → group effect ON' : '条件外の敵あり → OFF',
      tracedEnemyIds: alive.map((enemy) => enemy.id),
      targetEnemyIds,
    }
  }

  if (rule.kind === 'lowestHp') {
    const ordered = [...alive].sort((a, b) => a.hp - b.hp)
    return {
      family: 'ordered',
      label: 'ORDER RESOLVE',
      detail: firstTarget ? `HP順に比較 → ${firstTarget.name}` : '比較できる敵なし',
      tracedEnemyIds: ordered.map((enemy) => enemy.id),
      targetEnemyIds,
    }
  }

  return {
    family: 'reduced',
    label: 'REDUCE RESOLVE',
    detail: firstTarget ? `attackを順に比較 → ${firstTarget.name}` : '比較できる敵なし',
    tracedEnemyIds: alive.map((enemy) => enemy.id),
    targetEnemyIds,
  }
}
