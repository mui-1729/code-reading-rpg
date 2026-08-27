import type { PlayerProgress } from '../progression/types'
import { equipmentById } from '../rpg/equipment'
import type { RpgState } from '../rpg/state'
import type { WorldTreasureId } from './worldMap'

export type TreasureReward = {
  gold: number
  patchKit: number
  equipmentId?: string
}

export type WorldTreasureDefinition = {
  id: WorldTreasureId
  name: string
  reward: TreasureReward
}

export const worldTreasureDefinitions: Record<WorldTreasureId, WorldTreasureDefinition> = {
  'js-debug-cache': {
    id: 'js-debug-cache',
    name: 'DEBUG CACHE',
    reward: { gold: 20, patchKit: 0, equipmentId: 'debug-charm' },
  },
  'ts-supply-cache': {
    id: 'ts-supply-cache',
    name: 'TYPE CACHE',
    reward: { gold: 35, patchKit: 1 },
  },
}

export type OpenTreasureResult = {
  opened: boolean
  progress: PlayerProgress
  rpgState: RpgState
  definition: WorldTreasureDefinition
  equipmentAwarded: boolean
}

export function openWorldTreasure(
  progress: PlayerProgress,
  rpgState: RpgState,
  treasureId: WorldTreasureId,
): OpenTreasureResult {
  const definition = worldTreasureDefinitions[treasureId]
  if (rpgState.openedTreasureIds.includes(treasureId)) {
    return {
      opened: false,
      progress,
      rpgState,
      definition,
      equipmentAwarded: false,
    }
  }

  const equipmentId = definition.reward.equipmentId
  const canAwardEquipment =
    equipmentId !== undefined &&
    equipmentById[equipmentId] !== undefined &&
    !rpgState.ownedEquipmentIds.includes(equipmentId)

  return {
    opened: true,
    progress: {
      ...progress,
      gold: progress.gold + definition.reward.gold,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit + definition.reward.patchKit,
      },
    },
    rpgState: {
      ...rpgState,
      openedTreasureIds: [...rpgState.openedTreasureIds, treasureId],
      ownedEquipmentIds: canAwardEquipment && equipmentId
        ? [...rpgState.ownedEquipmentIds, equipmentId]
        : rpgState.ownedEquipmentIds,
    },
    definition,
    equipmentAwarded: canAwardEquipment,
  }
}
