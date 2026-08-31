import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './worldMap'

export type WorldPosition = { x: number; y: number }

export const getWorldSpriteStyle = (sprite: WorldPosition, viewportStart: WorldPosition) => ({
  left: `${((sprite.x - viewportStart.x + 0.5) / VIEWPORT_WIDTH) * 100}%`,
  top: `${((sprite.y - viewportStart.y + 0.5) / VIEWPORT_HEIGHT) * 100}%`,
})

export const isWorldPositionVisible = (position: WorldPosition, viewportStart: WorldPosition) =>
  position.x >= viewportStart.x &&
  position.x < viewportStart.x + VIEWPORT_WIDTH &&
  position.y >= viewportStart.y &&
  position.y < viewportStart.y + VIEWPORT_HEIGHT
