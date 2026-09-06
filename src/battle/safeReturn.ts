import type { RpgState } from '../rpg/state'
import { normalizeWorldCheckpoint } from '../world/worldCheckpoints'

function returnAt(
  rpgState: RpgState,
  worldPosition: { x: number; y: number },
): RpgState {
  const safeCheckpoint = normalizeWorldCheckpoint(rpgState.safeCheckpoint)
  return {
    ...rpgState,
    safeCheckpoint,
    worldMapId: safeCheckpoint.mapId,
    worldPosition,
    stepsSinceEncounter: 0,
  }
}

/**
 * Defeat RETURN is an emergency retreat, not a free heal.
 * Items and HP stay at the immutable Battle-start state while the World position
 * moves to the explicitly saved safe hub. Current map/x coordinates never infer
 * the destination.
 */
export function getSafeBattleReturnState(rpgState: RpgState): RpgState {
  const safeCheckpoint = normalizeWorldCheckpoint(rpgState.safeCheckpoint)
  return returnAt(rpgState, { ...safeCheckpoint.position })
}
