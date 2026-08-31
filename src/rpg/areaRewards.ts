import type { AreaDefinition } from '../game/areas'
import type { PlayerProgress } from '../progression/types'
import { equipmentById } from './equipment'
import type { RpgState } from './state'

/** Area metadata owns both the reward announcement and actual inventory grant. */
export function grantAreaClearEquipment(
  progress: Pick<PlayerProgress, 'clearedAreaIds'>,
  state: RpgState,
  registry: readonly Pick<AreaDefinition, 'id' | 'clearRewardEquipmentId'>[],
): RpgState {
  const owned = new Set(state.ownedEquipmentIds)
  for (const area of registry) {
    const rewardId = area.clearRewardEquipmentId
    if (rewardId && equipmentById[rewardId] && progress.clearedAreaIds.includes(area.id)) {
      owned.add(rewardId)
    }
  }
  return owned.size === state.ownedEquipmentIds.length
    ? state
    : { ...state, ownedEquipmentIds: [...owned] }
}
