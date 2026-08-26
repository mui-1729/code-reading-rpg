import { describe, expect, it } from 'vitest'
import { getPositionInDirection, isBlocked } from './field'
import { typescriptField } from './typescriptField'
import type { Direction, FieldPosition } from './types'

const directions: Direction[] = ['up', 'down', 'left', 'right']
const positionKey = (position: FieldPosition) => `${position.x}:${position.y}`

function getReachablePositions(): Set<string> {
  const reachable = new Set<string>([positionKey(typescriptField.start)])
  const queue: FieldPosition[] = [typescriptField.start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (const direction of directions) {
      const next = getPositionInDirection(current, direction)
      const key = positionKey(next)
      if (reachable.has(key) || isBlocked(typescriptField, next)) continue
      reachable.add(key)
      queue.push(next)
    }
  }

  return reachable
}

describe('TypeScript field layout', () => {
  it('開始地点から中央を通って奥まで進める', () => {
    const reachable = getReachablePositions()

    for (const position of [
      { x: 5, y: 6 },
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 3 },
    ]) {
      expect(reachable.has(positionKey(position))).toBe(true)
    }
  })

  it('すべてのGate・看板・Exitの手前まで到達できる', () => {
    const reachable = getReachablePositions()

    for (const interaction of typescriptField.interactions) {
      const hasReachableAdjacentTile = directions.some((direction) => {
        const adjacent = getPositionInDirection(interaction, direction)
        return reachable.has(positionKey(adjacent))
      })

      expect(hasReachableAdjacentTile, interaction.id).toBe(true)
    }
  })
})
