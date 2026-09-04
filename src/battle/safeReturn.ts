import type { RpgState } from '../rpg/state'

/**
 * Defeat RETURN is an emergency retreat, not a free heal.
 * HP / Item stay at the immutable Battle-start state. Only the World location
 * moves to the last persistent safe hub recorded in RpgState.
 */
export function getSafeBattleReturnState(rpgState: RpgState): RpgState {
  return {
    ...rpgState,
    worldMapId: rpgState.worldCheckpoint.mapId,
    worldPosition: { ...rpgState.worldCheckpoint.position },
    stepsSinceEncounter: 0,
  }
}
