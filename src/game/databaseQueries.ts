import type { Enemy } from './types'

export type DatabaseQuery = {
  where?: { column: 'hp' | 'attackDamage'; minimum: number }
  orderBy: 'hp' | 'attackDamage'
  direction: 'ASC' | 'DESC'
  limit: 1 | 2
}

/** The rendered SQL and resolver share this authored query, never evaluate code strings. */
export function renderDatabaseQuery(query: DatabaseQuery): string {
  const predicate = query.where ? ` AND ${query.where.column} >= ${query.where.minimum}` : ''
  return `SELECT id\nFROM enemies\nWHERE hp > 0${predicate}\nORDER BY ${query.orderBy} ${query.direction}, id ASC\nLIMIT ${query.limit};`
}

export function resolveDatabaseQuery(enemies: readonly Enemy[], query: DatabaseQuery): Enemy[] {
  const direction = query.direction === 'ASC' ? 1 : -1
  return enemies
    .filter(
      (enemy) => enemy.hp > 0 && (!query.where || enemy[query.where.column] >= query.where.minimum),
    )
    .sort(
      (left, right) =>
        (left[query.orderBy] - right[query.orderBy]) * direction ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    )
    .slice(0, query.limit)
}
