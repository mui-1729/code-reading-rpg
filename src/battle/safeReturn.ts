import type { RpgState } from '../rpg/state'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_MAP_STARTS,
} from '../world/worldMap'

/**
 * Defeat RETURN is a recovery decision, not an exact Battle-start rollback.
 * HP / items stay at the immutable Battle-start values, while position moves to
 * a nearby safe hub where the player can rest or resupply.
 */
export function getSafeBattleReturnState(rpgState: RpgState): RpgState {
  if (
    rpgState.worldMapId === JS_FOREST_MAP_ID ||
    rpgState.worldMapId === JS_DEEP_FOREST_MAP_ID
  ) {
    return {
      ...rpgState,
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID] },
      stepsSinceEncounter: 0,
    }
  }

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    return {
      ...rpgState,
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
      stepsSinceEncounter: 0,
    }
  }

  return {
    ...rpgState,
    worldPosition: { ...WORLD_MAP_STARTS[rpgState.worldMapId] },
    stepsSinceEncounter: 0,
  }
}
