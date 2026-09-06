import { describe, expect, it } from 'vitest'
import { getWorldFacingFromMove, getWorldInteractionTarget } from './worldInteractionTarget'

describe('world interaction target', () => {
  it('movement intent updates facing even before position changes', () => {
    expect(getWorldFacingFromMove(0, -1, 'down')).toBe('up')
    expect(getWorldFacingFromMove(1, 0, 'up')).toBe('right')
    expect(getWorldFacingFromMove(0, 1, 'right')).toBe('down')
    expect(getWorldFacingFromMove(-1, 0, 'down')).toBe('left')
  })

  it('interaction resolves exactly one tile in front of the player', () => {
    const position = { x: 10, y: 20 }
    expect(getWorldInteractionTarget(position, 'up')).toEqual({ x: 10, y: 19 })
    expect(getWorldInteractionTarget(position, 'right')).toEqual({ x: 11, y: 20 })
    expect(getWorldInteractionTarget(position, 'down')).toEqual({ x: 10, y: 21 })
    expect(getWorldInteractionTarget(position, 'left')).toEqual({ x: 9, y: 20 })
  })
})
