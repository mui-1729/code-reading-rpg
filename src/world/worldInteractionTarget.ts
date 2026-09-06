import type { WorldFacing } from './worldPresentation'
import type { WorldPosition } from './worldSceneGeometry'

export function getWorldFacingFromMove(dx: number, dy: number, current: WorldFacing): WorldFacing {
  if (dx < 0) return 'left'
  if (dx > 0) return 'right'
  if (dy < 0) return 'up'
  if (dy > 0) return 'down'
  return current
}

export function getWorldInteractionTarget(
  position: WorldPosition,
  facing: WorldFacing,
): WorldPosition {
  switch (facing) {
    case 'up':
      return { x: position.x, y: position.y - 1 }
    case 'down':
      return { x: position.x, y: position.y + 1 }
    case 'left':
      return { x: position.x - 1, y: position.y }
    case 'right':
      return { x: position.x + 1, y: position.y }
  }
}
