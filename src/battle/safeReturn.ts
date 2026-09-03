import type { RpgState } from '../rpg/state'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_MAP_STARTS,
  type WorldMapId,
} from '../world/worldMap'
import { WORLD_RECOVERY_STOPS } from '../world/recoveryStops'

const FOREST_CAMP = WORLD_RECOVERY_STOPS.find((stop) => stop.id === 'forest-traveler-camp')!
const DEEP_FOREST_SPRING = WORLD_RECOVERY_STOPS.find((stop) => stop.id === 'deep-forest-spring')!

function safeRoadPosition(stop: { position: { x: number; y: number } }) {
  return { x: stop.position.x, y: stop.position.y - 1 }
}

function returnAt(
  rpgState: RpgState,
  mapId: WorldMapId,
  worldPosition: { x: number; y: number },
): RpgState {
  return {
    ...rpgState,
    worldMapId: mapId,
    worldPosition,
    stepsSinceEncounter: 0,
  }
}

/**
 * Defeat RETURN is an emergency retreat, not a free heal.
 * Items and HP stay at the immutable Battle-start state while the World position
 * moves to a safe point with a recovery option nearby.
 */
export function getSafeBattleReturnState(rpgState: RpgState): RpgState {
  if (rpgState.worldMapId === JS_FOREST_MAP_ID) {
    if (rpgState.worldPosition.x <= FOREST_CAMP.position.x) {
      return returnAt(rpgState, JS_FOREST_MAP_ID, safeRoadPosition(FOREST_CAMP))
    }
    return returnAt(
      rpgState,
      JS_VILLAGE_MAP_ID,
      { ...WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID] },
    )
  }

  if (rpgState.worldMapId === JS_DEEP_FOREST_MAP_ID) {
    if (rpgState.worldPosition.x <= DEEP_FOREST_SPRING.position.x) {
      return returnAt(
        rpgState,
        JS_DEEP_FOREST_MAP_ID,
        safeRoadPosition(DEEP_FOREST_SPRING),
      )
    }
    return returnAt(
      rpgState,
      JS_FOREST_MAP_ID,
      safeRoadPosition(FOREST_CAMP),
    )
  }

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    return returnAt(
      rpgState,
      OVERWORLD_MAP_ID,
      { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    )
  }

  return returnAt(
    rpgState,
    rpgState.worldMapId,
    { ...WORLD_MAP_STARTS[rpgState.worldMapId] },
  )
}
