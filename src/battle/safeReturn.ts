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
  maxHp: number,
): RpgState {
  return {
    ...rpgState,
    worldMapId: mapId,
    worldPosition,
    currentHp: Math.max(rpgState.currentHp, Math.ceil(Math.max(1, maxHp) * 0.5)),
    stepsSinceEncounter: 0,
  }
}

/**
 * Defeat RETURN is an emergency recovery decision, not an exact Battle-start rollback.
 * Items return to the immutable Battle-start state. World position moves to the latest
 * safe point the route has already passed, and HP is raised only to 50% so Inn/camp
 * recovery and resupply still matter.
 */
export function getSafeBattleReturnState(rpgState: RpgState, maxHp: number): RpgState {
  if (rpgState.worldMapId === JS_FOREST_MAP_ID) {
    if (rpgState.worldPosition.x <= FOREST_CAMP.position.x) {
      return returnAt(rpgState, JS_FOREST_MAP_ID, safeRoadPosition(FOREST_CAMP), maxHp)
    }
    return returnAt(
      rpgState,
      JS_VILLAGE_MAP_ID,
      { ...WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID] },
      maxHp,
    )
  }

  if (rpgState.worldMapId === JS_DEEP_FOREST_MAP_ID) {
    if (rpgState.worldPosition.x <= DEEP_FOREST_SPRING.position.x) {
      return returnAt(
        rpgState,
        JS_DEEP_FOREST_MAP_ID,
        safeRoadPosition(DEEP_FOREST_SPRING),
        maxHp,
      )
    }
    return returnAt(
      rpgState,
      JS_FOREST_MAP_ID,
      safeRoadPosition(FOREST_CAMP),
      maxHp,
    )
  }

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    return returnAt(
      rpgState,
      OVERWORLD_MAP_ID,
      { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
      maxHp,
    )
  }

  return returnAt(
    rpgState,
    rpgState.worldMapId,
    { ...WORLD_MAP_STARTS[rpgState.worldMapId] },
    maxHp,
  )
}
