import { createSeededRandom } from '../game/random'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import {
  BYTE_POSITION,
  getEncounterBattleId,
  getEncounterChance,
  getTerrain,
  getWorldPortalAtPosition,
  getWorldRegion,
  isAdjacent,
  isEncounterTerrain,
  isWalkableTerrain,
  JS_BOSS_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
  RECOVERY_POSITION,
  SHOP_POSITION,
  TS_BOSS_POSITION,
  WORLD_TREASURES,
  type Terrain,
  type WorldMapId,
  type WorldRegion,
  type WorldTreasureId,
} from './worldMap'

type BattleRegion = Exclude<WorldRegion, 'hub'>
type JavaScriptTrainingBattleId = 7 | 8 | 9

export type EncounterRolls = {
  trigger: number
  battle: number
}

export type WorldBattleIntent = {
  battleId: number
  region: BattleRegion
  seed: string
}

export type WorldMoveResult =
  | {
      kind: 'blocked'
      nextState: RpgState
      terrain: Terrain
    }
  | {
      kind: 'moved'
      nextState: RpgState
      terrain: Terrain
      region: WorldRegion
    }
  | {
      kind: 'transition'
      nextState: RpgState
      terrain: Terrain
      region: WorldRegion
      fromMapId: WorldMapId
      toMapId: WorldMapId
      label: string
    }
  | {
      kind: 'encounter'
      nextState: RpgState
      terrain: Terrain
      region: BattleRegion
      battle: WorldBattleIntent
    }

export type ResolveWorldMoveInput = {
  rpgState: RpgState
  progress: PlayerProgress
  dx: number
  dy: number
  encounterRolls?: EncounterRolls
}

function createEncounterRolls(
  rpgState: RpgState,
  nextX: number,
  nextY: number,
  nextSteps: number,
): EncounterRolls {
  const seedBase =
    rpgState.worldMapId === OVERWORLD_MAP_ID
      ? `${rpgState.encounterCount}:${nextX}:${nextY}:${nextSteps}`
      : `${rpgState.worldMapId}:${rpgState.encounterCount}:${nextX}:${nextY}:${nextSteps}`
  const random = createSeededRandom(seedBase)
  return { trigger: random.next(), battle: random.next() }
}

export function resolveWorldMove({
  rpgState,
  progress,
  dx,
  dy,
  encounterRolls,
}: ResolveWorldMoveInput): WorldMoveResult {
  const next = {
    x: rpgState.worldPosition.x + dx,
    y: rpgState.worldPosition.y + dy,
  }
  const mapId = rpgState.worldMapId
  const terrain = getTerrain(next.x, next.y, mapId)

  if (!isWalkableTerrain(terrain)) {
    return { kind: 'blocked', nextState: rpgState, terrain }
  }

  const nextSteps = rpgState.stepsSinceEncounter + 1
  const portal = getWorldPortalAtPosition(mapId, next)
  if (portal) {
    if (
      portal.requiredClearedStageId !== undefined &&
      !progress.clearedStageIds.includes(portal.requiredClearedStageId)
    ) {
      return { kind: 'blocked', nextState: rpgState, terrain }
    }

    const region = getWorldRegion(portal.targetPosition.x, portal.toMapId)
    return {
      kind: 'transition',
      terrain,
      region,
      fromMapId: mapId,
      toMapId: portal.toMapId,
      label: portal.label,
      nextState: {
        ...rpgState,
        worldMapId: portal.toMapId,
        worldPosition: { ...portal.targetPosition },
        stepsSinceEncounter: nextSteps,
      },
    }
  }

  const region = getWorldRegion(next.x, mapId)
  const movedState: RpgState = {
    ...rpgState,
    worldPosition: next,
    stepsSinceEncounter: nextSteps,
  }

  if (!isEncounterTerrain(terrain) || nextSteps < 5 || region === 'hub') {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  const rolls = encounterRolls ?? createEncounterRolls(rpgState, next.x, next.y, nextSteps)
  if (rolls.trigger >= getEncounterChance(terrain)) {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  const battleId = getEncounterBattleId(
    region,
    progress.unlockedStageIds,
    progress.clearedStageIds,
    rolls.battle,
    mapId,
  )
  if (battleId === null) {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  const encounterNumber = rpgState.encounterCount + 1
  const encounterState: RpgState = {
    ...movedState,
    stepsSinceEncounter: 0,
    encounterCount: encounterNumber,
  }
  const encounterSeed =
    mapId === OVERWORLD_MAP_ID
      ? `encounter:${encounterNumber}:${next.x}:${next.y}`
      : `encounter:${mapId}:${encounterNumber}:${next.x}:${next.y}`

  return {
    kind: 'encounter',
    nextState: encounterState,
    terrain,
    region,
    battle: {
      battleId,
      region,
      seed: encounterSeed,
    },
  }
}

export function getNextJavaScriptTrainingBattleId(
  clearedStageIds: readonly number[],
): JavaScriptTrainingBattleId | null {
  if (!clearedStageIds.includes(7)) return 7
  if (!clearedStageIds.includes(8)) return 8
  if (!clearedStageIds.includes(9)) return 9
  return null
}

export type WorldInteractionIntent =
  | {
      kind: 'party'
      memberId: 'byte'
      alreadyJoined: boolean
    }
  | {
      kind: 'shop'
    }
  | {
      kind: 'recovery'
    }
  | {
      kind: 'treasure'
      treasureId: WorldTreasureId
      opened: boolean
    }
  | {
      kind: 'training'
      battleId: JavaScriptTrainingBattleId | null
    }
  | {
      kind: 'boss'
      battleId: 3 | 6
      region: BattleRegion
      unlocked: boolean
      seed: string
    }
  | {
      kind: 'none'
    }

export function resolveWorldInteraction(
  rpgState: RpgState,
  progress: PlayerProgress,
): WorldInteractionIntent {
  const position = rpgState.worldPosition

  if (rpgState.worldMapId === JS_VILLAGE_MAP_ID) {
    if (isAdjacent(position, JS_VILLAGE_TRAINING_POSITION)) {
      return {
        kind: 'training',
        battleId: getNextJavaScriptTrainingBattleId(progress.clearedStageIds),
      }
    }
    return { kind: 'none' }
  }

  if (rpgState.worldMapId !== OVERWORLD_MAP_ID) return { kind: 'none' }

  if (isAdjacent(position, BYTE_POSITION)) {
    return {
      kind: 'party',
      memberId: 'byte',
      alreadyJoined: rpgState.partyMemberIds.includes('byte'),
    }
  }

  if (isAdjacent(position, SHOP_POSITION)) {
    return { kind: 'shop' }
  }

  if (isAdjacent(position, RECOVERY_POSITION)) {
    return { kind: 'recovery' }
  }

  const treasure = WORLD_TREASURES.find(
    (candidate) =>
      candidate.mapId === rpgState.worldMapId && isAdjacent(position, candidate.position),
  )
  if (treasure) {
    return {
      kind: 'treasure',
      treasureId: treasure.id,
      opened: rpgState.openedTreasureIds.includes(treasure.id),
    }
  }

  if (isAdjacent(position, JS_BOSS_POSITION)) {
    return {
      kind: 'boss',
      battleId: 3,
      region: 'javascript',
      unlocked: progress.unlockedStageIds.includes(3),
      seed: `boss:js:${rpgState.encounterCount}`,
    }
  }

  if (isAdjacent(position, TS_BOSS_POSITION)) {
    return {
      kind: 'boss',
      battleId: 6,
      region: 'typescript',
      unlocked: progress.unlockedStageIds.includes(6),
      seed: `boss:ts:${rpgState.encounterCount}`,
    }
  }

  return { kind: 'none' }
}
