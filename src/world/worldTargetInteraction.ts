import { isBattleAccessible, type PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import { getWorldNpcAtPosition, type WorldNpcPlacement } from './worldCharacters'
import { registerCheckpointForMapEntry } from './worldCheckpoints'
import {
  getWorldRecoveryStopAtPosition,
  type WorldRecoveryStop,
} from './recoveryStops'
import { VILLAGE_FACILITIES, type VillageFacilityKind } from './villageFacilityData'
import {
  BYTE_POSITION,
  getWorldPortalAtPosition,
  JS_BOSS_POSITION,
  JS_FOREST_MAP_ID,
  JS_FOREST_MIDBOSS_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
  RECOVERY_POSITION,
  SHOP_POSITION,
  TS_BOSS_POSITION,
  TS_FRONTIER_MAP_ID,
  WORLD_TREASURES,
  type WorldMapId,
  type WorldRegion,
  type WorldTreasureId,
} from './worldMap'
import { isWorldPortalRequirementSatisfied } from './worldPortalAccess'
import { getNextJavaScriptTrainingBattleId } from './worldActions'
import type { WorldPosition } from './worldSceneGeometry'

type BattleRegion = Exclude<WorldRegion, 'hub'>

type BaseTargetIntent =
  | { kind: 'none' }
  | { kind: 'npc'; placement: WorldNpcPlacement }
  | { kind: 'party'; memberId: 'byte'; alreadyJoined: boolean }
  | { kind: 'shop' }
  | { kind: 'recovery' }
  | { kind: 'recovery-stop'; stop: WorldRecoveryStop }
  | { kind: 'village-facility'; facility: VillageFacilityKind }
  | { kind: 'treasure'; treasureId: WorldTreasureId; opened: boolean }
  | { kind: 'training'; battleId: 7 | 8 | 9 | null }
  | {
      kind: 'midboss'
      battleId: 13
      region: 'javascript'
      unlocked: boolean
      seed: string
    }
  | {
      kind: 'boss'
      battleId: 3 | 6
      region: BattleRegion
      unlocked: boolean
      seed: string
    }
  | {
      kind: 'map-transition'
      nextState: RpgState
      toMapId: WorldMapId
      label: string
    }
  | {
      kind: 'locked-portal'
      toMapId: WorldMapId
      label: string
    }

export type WorldTargetInteractionIntent = BaseTargetIntent

function samePosition(left: WorldPosition, right: WorldPosition) {
  return left.x === right.x && left.y === right.y
}

function resolvePortal(
  rpgState: RpgState,
  progress: PlayerProgress,
  target: WorldPosition,
): WorldTargetInteractionIntent | null {
  const portal = getWorldPortalAtPosition(rpgState.worldMapId, target)
  if (!portal) return null
  if (!isWorldPortalRequirementSatisfied(portal.requiredClearedStageId, progress.clearedStageIds)) {
    return { kind: 'locked-portal', toMapId: portal.toMapId, label: portal.label }
  }

  const nextState = registerCheckpointForMapEntry({
    ...rpgState,
    worldMapId: portal.toMapId,
    worldPosition: { ...portal.targetPosition },
    stepsSinceEncounter: rpgState.stepsSinceEncounter + 1,
  })

  return {
    kind: 'map-transition',
    toMapId: portal.toMapId,
    label: portal.label,
    nextState,
  }
}

export function resolveWorldTargetInteraction(
  rpgState: RpgState,
  progress: PlayerProgress,
  target: WorldPosition,
): WorldTargetInteractionIntent {
  const mapId = rpgState.worldMapId

  const treasure = WORLD_TREASURES.find(
    (candidate) => candidate.mapId === mapId && samePosition(candidate.position, target),
  )
  if (treasure) {
    return {
      kind: 'treasure',
      treasureId: treasure.id,
      opened: rpgState.openedTreasureIds.includes(treasure.id),
    }
  }

  const recoveryStop = getWorldRecoveryStopAtPosition(mapId, target)
  if (recoveryStop) return { kind: 'recovery-stop', stop: recoveryStop }

  if (mapId === JS_VILLAGE_MAP_ID) {
    const facility = VILLAGE_FACILITIES.find((candidate) => samePosition(candidate.position, target))
    if (facility) return { kind: 'village-facility', facility: facility.kind }

    if (samePosition(JS_VILLAGE_TRAINING_POSITION, target)) {
      const battleId = getNextJavaScriptTrainingBattleId(progress.clearedStageIds)
      if (battleId !== null) return { kind: 'training', battleId }
    }
  }

  if (mapId === JS_FOREST_MAP_ID && samePosition(JS_FOREST_MIDBOSS_POSITION, target)) {
    if (progress.clearedStageIds.includes(13)) return { kind: 'none' }
    return {
      kind: 'midboss',
      battleId: 13,
      region: 'javascript',
      unlocked: isBattleAccessible(13, progress.clearedStageIds),
      seed: `midboss:js-forest:${rpgState.encounterCount}`,
    }
  }

  if (mapId === TS_FRONTIER_MAP_ID && samePosition(TS_BOSS_POSITION, target)) {
    return {
      kind: 'boss',
      battleId: 6,
      region: 'typescript',
      unlocked: isBattleAccessible(6, progress.clearedStageIds),
      seed: `boss:ts:${rpgState.encounterCount}`,
    }
  }

  if (mapId === OVERWORLD_MAP_ID) {
    if (samePosition(BYTE_POSITION, target)) {
      return {
        kind: 'party',
        memberId: 'byte',
        alreadyJoined: rpgState.partyMemberIds.includes('byte'),
      }
    }
    if (samePosition(SHOP_POSITION, target)) return { kind: 'shop' }
    if (samePosition(RECOVERY_POSITION, target)) return { kind: 'recovery' }
    if (samePosition(JS_BOSS_POSITION, target)) {
      return {
        kind: 'boss',
        battleId: 3,
        region: 'javascript',
        unlocked: isBattleAccessible(3, progress.clearedStageIds),
        seed: `boss:js:${rpgState.encounterCount}`,
      }
    }
  }

  const portal = resolvePortal(rpgState, progress, target)
  if (portal) return portal

  const npc = getWorldNpcAtPosition(mapId, target)
  if (npc) return { kind: 'npc', placement: npc }

  return { kind: 'none' }
}
