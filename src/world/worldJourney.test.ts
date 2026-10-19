import { describe, expect, it } from 'vitest'
import type { WorldPosition } from '../rpg'
import { getWorldNpcAtPosition } from './worldCharacters'
import { getWorldRecoveryStopAtPosition } from './recoveryStops'
import {
  getTerrain, getWorldMapDimensions, getWorldPortalAtPosition, isAdjacent,
  isWalkableTerrain, JS_FOREST_LEARNING_POSITIONS, JS_FOREST_MIDBOSS_POSITION,
  JS_FOREST_SETTLEMENT_POSITION, JS_FOREST_MAP_ID, JS_DEEP_FOREST_LEARNING_POSITIONS,
  JS_DEEP_FOREST_CORE_EXIT_POSITION, JS_DEEP_FOREST_MAP_ID, WORLD_MAP_STARTS,
  VIEWPORT_WIDTH, VIEWPORT_HEIGHT, type WorldMapId,
} from './worldMap'

const moves = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
const key = (position: WorldPosition) => `${position.x}:${position.y}`

function walkable(mapId: WorldMapId, position: WorldPosition) {
  return isWalkableTerrain(getTerrain(position.x, position.y, mapId)) &&
    !getWorldPortalAtPosition(mapId, position) &&
    !getWorldNpcAtPosition(mapId, position) &&
    !getWorldRecoveryStopAtPosition(mapId, position)
}

// Follow the actual lesson order, stopping beside an Action-only boss / exit.
// A shortest route must itself explore all four directions; optional detours
// must not be the only source of north/south/east movement.
function routeTo(mapId: WorldMapId, start: WorldPosition, target: WorldPosition) {
  const dimensions = getWorldMapDimensions(mapId)
  const queue: WorldPosition[][] = [[start]]
  const seen = new Set([key(start)])
  for (let index = 0; index < queue.length; index++) {
    const path = queue[index]
    const current = path.at(-1)!
    if (walkable(mapId, target) ? key(current) === key(target) : isAdjacent(current, target)) return path
    for (const move of moves) {
      const next = { x: current.x + move.x, y: current.y + move.y }
      if (next.x < 0 || next.y < 0 || next.x >= dimensions.width || next.y >= dimensions.height ||
        seen.has(key(next)) || !walkable(mapId, next)) continue
      seen.add(key(next))
      queue.push([...path, next])
    }
  }
  throw new Error(`Unreachable journey landmark: ${mapId} ${key(target)}`)
}

const forest = JS_FOREST_LEARNING_POSITIONS
const deep = JS_DEEP_FOREST_LEARNING_POSITIONS
const journeys = [
  { mapId: JS_FOREST_MAP_ID, targets: [forest[10], forest[11], forest[12], JS_FOREST_MIDBOSS_POSITION, forest[14], JS_FOREST_SETTLEMENT_POSITION] },
  { mapId: JS_DEEP_FOREST_MAP_ID, targets: [deep[15], deep[16], deep[17], deep[18], deep[19], deep[20], deep[21], deep[22], JS_DEEP_FOREST_CORE_EXIT_POSITION] },
]

describe('JavaScript main journey', () => {
  for (const { mapId, targets } of journeys) {
    it(`${mapId}: main progressionそのものが上下左右へ曲がり複数viewportを旅する`, () => {
      const path: WorldPosition[] = [WORLD_MAP_STARTS[mapId]]
      for (const target of targets) path.push(...routeTo(mapId, path.at(-1)!, target).slice(1))
      const directions = path.slice(1).map((position, index) =>
        key({ x: position.x - path[index].x, y: position.y - path[index].y }),
      )
      const turns = directions.filter((direction, index) => index > 0 && direction !== directions[index - 1]).length
      expect(new Set(directions)).toEqual(new Set(moves.map(key)))
      expect(turns).toBeGreaterThanOrEqual(4)
      expect(Math.max(...path.map((p) => p.x)) - Math.min(...path.map((p) => p.x))).toBeGreaterThan(VIEWPORT_WIDTH * 3)
      expect(Math.max(...path.map((p) => p.y)) - Math.min(...path.map((p) => p.y))).toBeGreaterThan(VIEWPORT_HEIGHT)
      expect(path.every((position) => walkable(mapId, position))).toBe(true)
    })
  }

  it('移動した学習地点の旧save座標も通行可能なまま残す', () => {
    expect(walkable(JS_FOREST_MAP_ID, { x: 9, y: 20 })).toBe(true)
    expect(walkable(JS_DEEP_FOREST_MAP_ID, { x: 23, y: 35 })).toBe(true)
  })
})
