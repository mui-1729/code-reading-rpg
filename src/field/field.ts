import type { Direction, FieldDefinition, FieldInteraction, FieldPosition } from './types'

const directionDelta: Record<Direction, FieldPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function samePosition(a: FieldPosition, b: FieldPosition): boolean {
  return a.x === b.x && a.y === b.y
}

export function getPositionInDirection(position: FieldPosition, direction: Direction): FieldPosition {
  const delta = directionDelta[direction]
  return { x: position.x + delta.x, y: position.y + delta.y }
}

export function isInsideField(field: FieldDefinition, position: FieldPosition): boolean {
  return position.x >= 0 && position.y >= 0 && position.x < field.width && position.y < field.height
}

export function isBlocked(field: FieldDefinition, position: FieldPosition): boolean {
  if (!isInsideField(field, position)) return true
  if (field.blockedTiles.some((tile) => samePosition(tile, position))) return true
  return field.interactions.some((interaction) => samePosition(interaction, position))
}

export function movePlayer(
  field: FieldDefinition,
  position: FieldPosition,
  direction: Direction,
): FieldPosition {
  const next = getPositionInDirection(position, direction)
  return isBlocked(field, next) ? position : next
}

export function getInteractionInFront(
  field: FieldDefinition,
  position: FieldPosition,
  direction: Direction,
): FieldInteraction | undefined {
  const target = getPositionInDirection(position, direction)
  return field.interactions.find((interaction) => samePosition(interaction, target))
}
