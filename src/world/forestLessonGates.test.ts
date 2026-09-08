import { describe, expect, it } from 'vitest'
import {
  getTerrain,
  isWalkableTerrain,
  JS_FOREST_LEARNING_POSITIONS,
  JS_FOREST_MAP_ID,
  JS_FOREST_MIDBOSS_POSITION,
  JS_FOREST_SETTLEMENT_POSITION,
  WORLD_MAP_STARTS,
} from './worldMap'

type Position = { x: number; y: number }

const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

const key = (position: Position) => `${position.x}:${position.y}`

function reachablePositions(
  clearedLessonIds: readonly (10 | 11 | 12 | 14)[],
  midbossCleared = false,
): Set<string> {
  const blockedLessonPositions = new Set(
    (Object.entries(JS_FOREST_LEARNING_POSITIONS) as [string, Position][])
      .filter(([battleId]) => !clearedLessonIds.includes(Number(battleId) as 10 | 11 | 12 | 14))
      .map(([, position]) => key(position)),
  )
  const start = WORLD_MAP_STARTS[JS_FOREST_MAP_ID]
  const visited = new Set<string>([key(start)])
  const queue: Position[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (const [dx, dy] of directions) {
      const next = { x: current.x + dx, y: current.y + dy }
      const nextKey = key(next)
      if (visited.has(nextKey) || blockedLessonPositions.has(nextKey)) continue

      const isClearedMidbossTile =
        midbossCleared &&
        next.x === JS_FOREST_MIDBOSS_POSITION.x &&
        next.y === JS_FOREST_MIDBOSS_POSITION.y
      if (!isClearedMidbossTile && !isWalkableTerrain(getTerrain(next.x, next.y, JS_FOREST_MAP_ID))) {
        continue
      }

      visited.add(nextKey)
      queue.push(next)
    }
  }

  return visited
}

function canApproach(visited: Set<string>, target: Position): boolean {
  return directions.some(([dx, dy]) => visited.has(key({ x: target.x + dx, y: target.y + dy })))
}

describe('Forest learning route gates', () => {
  it('探索区間は自由でも次区間へは10→11→12→13→14の順でしか抜けられない', () => {
    const before10 = reachablePositions([])
    expect(canApproach(before10, JS_FOREST_LEARNING_POSITIONS[10])).toBe(true)
    expect(canApproach(before10, JS_FOREST_LEARNING_POSITIONS[11])).toBe(false)

    const after10 = reachablePositions([10])
    expect(canApproach(after10, JS_FOREST_LEARNING_POSITIONS[11])).toBe(true)
    expect(canApproach(after10, JS_FOREST_LEARNING_POSITIONS[12])).toBe(false)

    const after11 = reachablePositions([10, 11])
    expect(canApproach(after11, JS_FOREST_LEARNING_POSITIONS[12])).toBe(true)
    expect(canApproach(after11, JS_FOREST_MIDBOSS_POSITION)).toBe(false)

    const after12 = reachablePositions([10, 11, 12])
    expect(canApproach(after12, JS_FOREST_MIDBOSS_POSITION)).toBe(true)
    expect(canApproach(after12, JS_FOREST_LEARNING_POSITIONS[14])).toBe(false)

    const after13 = reachablePositions([10, 11, 12], true)
    expect(canApproach(after13, JS_FOREST_LEARNING_POSITIONS[14])).toBe(true)
    expect(canApproach(after13, JS_FOREST_SETTLEMENT_POSITION)).toBe(false)

    const after14 = reachablePositions([10, 11, 12, 14], true)
    expect(canApproach(after14, JS_FOREST_SETTLEMENT_POSITION)).toBe(true)
  })
})
