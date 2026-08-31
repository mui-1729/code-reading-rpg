import type { Enemy } from './types'

const enemyVisualIds = new Set([
  'slime', 'goblin', 'golem', 'boss', 'sprout', 'boar', 'guardian', 'root-guardian',
])

export const ENEMY_VISUAL_FALLBACK_ID = 'enemy-fallback'

export function getEnemyVisualId(enemy: Pick<Enemy, 'visualId'>): string {
  return enemyVisualIds.has(enemy.visualId) ? enemy.visualId : ENEMY_VISUAL_FALLBACK_ID
}
