import type { PlayerProgress } from '../progression/types'
import type { RpgState } from '../rpg/state'
import { OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'

/** Uses the provider's normalized snapshot, including migrated/unified saves. */
export function hasExistingRun(rpgState: RpgState, progress: PlayerProgress): boolean {
  return (
    rpgState.worldMapId !== OVERWORLD_MAP_ID ||
    rpgState.worldPosition.x !== WORLD_START.x ||
    rpgState.worldPosition.y !== WORLD_START.y ||
    rpgState.encounterCount > 0 ||
    rpgState.openedTreasureIds.length > 0 ||
    rpgState.partyMemberIds.length > 0 ||
    progress.exp > 0 ||
    progress.clearedStageIds.length > 0
  )
}
