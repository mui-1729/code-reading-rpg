import { getWorldNpcAtPosition } from './worldCharacters'
import {
  getTerrain,
  getWorldPortalAtPosition,
  isWalkableTerrain,
  type WorldMapId,
} from './worldMap'
import { getWorldRecoveryStopAtPosition } from './recoveryStops'
import type { WorldPosition } from './worldSceneGeometry'

// The follower must not occupy a shelf, doorway, stair or person and hide it.
export function getWorldFollowerPosition(
  mapId: WorldMapId,
  player: WorldPosition,
  preferred: WorldPosition,
): WorldPosition | null {
  const candidates = [
    preferred,
    { x: player.x, y: player.y + 1 },
    { x: player.x - 1, y: player.y },
    { x: player.x + 1, y: player.y },
    { x: player.x, y: player.y - 1 },
  ]
  return (
    candidates.find(
      (position) =>
        Math.abs(position.x - player.x) + Math.abs(position.y - player.y) === 1 &&
        isWalkableTerrain(getTerrain(position.x, position.y, mapId)) &&
        !getWorldPortalAtPosition(mapId, position) &&
        !getWorldNpcAtPosition(mapId, position) &&
        !getWorldRecoveryStopAtPosition(mapId, position),
    ) ?? null
  )
}
