import { describe, expect, it } from 'vitest'
import { getInteractionInFront, movePlayer } from './field'
import type { FieldDefinition } from './types'

const field: FieldDefinition = {
  id: 'test-field',
  width: 5,
  height: 5,
  start: { x: 2, y: 3 },
  blockedTiles: [{ x: 1, y: 2 }],
  interactions: [
    { id: 'gate', kind: 'battle', stageId: 1, label: 'GATE', x: 2, y: 1 },
    { id: 'sign', kind: 'sign', message: 'hello', x: 3, y: 3 },
  ],
}

describe('field movement', () => {
  it('4方向へ1tileずつ移動できる', () => {
    const start = { x: 2, y: 3 }

    expect(movePlayer(field, start, 'up')).toEqual({ x: 2, y: 2 })
    expect(movePlayer(field, start, 'down')).toEqual({ x: 2, y: 4 })
    expect(movePlayer(field, start, 'left')).toEqual({ x: 1, y: 3 })
  })

  it('障害物・field外・interaction tileには侵入しない', () => {
    expect(movePlayer(field, { x: 1, y: 3 }, 'up')).toEqual({ x: 1, y: 3 })
    expect(movePlayer(field, { x: 0, y: 0 }, 'left')).toEqual({ x: 0, y: 0 })
    expect(movePlayer(field, { x: 2, y: 2 }, 'up')).toEqual({ x: 2, y: 2 })
  })

  it('正面のinteractable objectだけを取得する', () => {
    expect(getInteractionInFront(field, { x: 2, y: 2 }, 'up')?.id).toBe('gate')
    expect(getInteractionInFront(field, { x: 2, y: 3 }, 'right')?.id).toBe('sign')
    expect(getInteractionInFront(field, { x: 2, y: 3 }, 'left')).toBeUndefined()
  })
})
