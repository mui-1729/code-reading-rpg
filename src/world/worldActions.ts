import { createSeededRandom } from '../game/random'
import {
  getCanonicalUnlockedStageIds,
  isBattleAccessible,
  type PlayerProgress,
} from '../progression'
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
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_FOREST_MIDBOSS_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_POSITION,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
  RECOVERY_POSITION,
  SHOP_POSITION,
  TS_BOSS_POSITION,
  TS_FRONTIER_MAP_ID,
  WORLD_TREASURES,
  type Terrain,
  type WorldMapId,
  type WorldRegion,
  type WorldTreasureId,
} from './worldMap'
import { isWorldPortalRequirementSatisfied } from './worldPortalAccess'

type BattleRegion = Exclude<WorldRegion, 'hub'>
type JavaScriptTrainingBattleId = 7 | 8 | 9
type JavaScriptStoryBattleId = 1 | 2
type JavaScriptLearningBattleId = 10 | 11 | 12 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22
type JavaScriptFixedBattleId = JavaScriptStoryBattleId | JavaScriptLearningBattleId

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

function getForestLearningBattleId(
  mapId: WorldMapId,
  position: { x: number; y: number },
  clearedStageIds: readonly number[],
): JavaScriptLearningBattleId | null {
  if (mapId !== JS_FOREST_MAP_ID) return null

  if (!clearedStageIds.includes(10) && isBattleAccessible(10, clearedStageIds)) return 10
  if (
    !clearedStageIds.includes(11) &&
    position.x <= 17 &&
    isBattleAccessible(11, clearedStageIds)
  ) {
    return 11
  }
  if (
    !clearedStageIds.includes(12) &&
    position.x <= 8 &&
    isBattleAccessible(12, clearedStageIds)
  ) {
    return 12
  }
  if (!clearedStageIds.includes(13)) return null
  if (
    !clearedStageIds.includes(14) &&
    position.x <= 4 &&
    isBattleAccessible(14, clearedStageIds)
  ) {
    return 14
  }
  return null
}

function getDeepForestLearningBattleId(
  mapId: WorldMapId,
  position: { x: number; y: number },
  clearedStageIds: readonly number[],
): JavaScriptLearningBattleId | null {
  if (mapId !== JS_DEEP_FOREST_MAP_ID) return null

  if (!clearedStageIds.includes(15) && isBattleAccessible(15, clearedStageIds)) return 15
  if (
    !clearedStageIds.includes(16) &&
    position.x <= 24 &&
    isBattleAccessible(16, clearedStageIds)
  ) {
    return 16
  }
  if (
    !clearedStageIds.includes(17) &&
    position.x <= 19 &&
    isBattleAccessible(17, clearedStageIds)
  ) {
    return 17
  }
  if (
    !clearedStageIds.includes(18) &&
    position.x <= 14 &&
    isBattleAccessible(18, clearedStageIds)
  ) {
    return 18
  }
  if (
    !clearedStageIds.includes(19) &&
    position.x <= 10 &&
    isBattleAccessible(19, clearedStageIds)
  ) {
    return 19
  }
  if (
    !clearedStageIds.includes(20) &&
    position.x <= 9 &&
    isBattleAccessible(20, clearedStageIds)
  ) {
    return 20
  }
  if (
    !clearedStageIds.includes(21) &&
    position.x <= 7 &&
    isBattleAccessible(21, clearedStageIds)
  ) {
    return 21
  }
  if (
    !clearedStageIds.includes(22) &&
    position.x <= 5 &&
    isBattleAccessible(22, clearedStageIds)
  ) {
    return 22
  }
  return null
}

export function getDeepForestReviewBattleId(
  clearedStageIds: readonly number[],
  roll: number,
): number | null {
  const candidates = [14, 15, 16, 17, 18, 20, 21, 22].filter((battleId) =>
    clearedStageIds.includes(battleId),
  )
  if (candidates.length === 0) return null

  const normalizedRoll = Math.max(0, Math.min(0.999999, roll))
  return candidates[Math.floor(normalizedRoll * candidates.length)] ?? null
}

function createJavaScriptFixedEncounter(
  rpgState: RpgState,
  movedState: RpgState,
  next: { x: number; y: number },
  battleId: JavaScriptFixedBattleId,
): WorldMoveResult {
  const encounterNumber = rpgState.encounterCount + 1
  const encounterState: RpgState = {
    ...movedState,
    stepsSinceEncounter: 0,
    encounterCount: encounterNumber,
  }

  return {
    kind: 'encounter',
    nextState: encounterState,
    terrain: getTerrain(next.x, next.y, rpgState.worldMapId),
    region: 'javascript',
    battle: {
      battleId,
      region: 'javascript',
      seed: `encounter:${rpgState.worldMapId}:${encounterNumber}:${next.x}:${next.y}`,
    },
  }
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
  const rawTerrain = getTerrain(next.x, next.y, mapId)
  const midbossCleared =
    mapId === JS_FOREST_MAP_ID &&
    rawTerrain === 'midboss' &&
    progress.clearedStageIds.includes(13)
  const terrain: Terrain = midbossCleared ? 'road' : rawTerrain

  if (!isWalkableTerrain(terrain)) {
    return { kind: 'blocked', nextState: rpgState, terrain }
  }

  const nextSteps = rpgState.stepsSinceEncounter + 1
  const portal = getWorldPortalAtPosition(mapId, next)
  if (portal) {
    if (!isWorldPortalRequirementSatisfied(portal.requiredClearedStageId, progress.clearedStageIds)) {
      return { kind: 'blocked', nextState: rpgState, terrain }
    }

    // GREENFIELD VILLAGE is a deliberate RPG interaction: walking into the
    // entrance stops at the threshold, then INTERACT performs the transition.
    if (mapId === OVERWORLD_MAP_ID && portal.toMapId === JS_VILLAGE_MAP_ID) {
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

  // Story Battles are deterministic route beats, not lucky random encounters.
  // The first symptom is witnessed before training, after BYTE joins the party.
  // The second symptom happens after Forest investigation at Deep Forest entry.
  if (
    mapId === OVERWORLD_MAP_ID &&
    region === 'javascript' &&
    rpgState.partyMemberIds.includes('byte') &&
    !progress.clearedStageIds.includes(1) &&
    isBattleAccessible(1, progress.clearedStageIds)
  ) {
    return createJavaScriptFixedEncounter(rpgState, movedState, next, 1)
  }

  if (
    mapId === JS_DEEP_FOREST_MAP_ID &&
    !progress.clearedStageIds.includes(2) &&
    isBattleAccessible(2, progress.clearedStageIds)
  ) {
    return createJavaScriptFixedEncounter(rpgState, movedState, next, 2)
  }

  if (isEncounterTerrain(terrain)) {
    const lessonBattleId =
      getForestLearningBattleId(mapId, next, progress.clearedStageIds) ??
      getDeepForestLearningBattleId(mapId, next, progress.clearedStageIds)
    if (lessonBattleId !== null) {
      return createJavaScriptFixedEncounter(rpgState, movedState, next, lessonBattleId)
    }
  }

  if (!isEncounterTerrain(terrain) || nextSteps < 5 || region === 'hub') {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  // During the JavaScript main story, Overworld movement carries narrative
  // beats rather than replay encounters. Forest and Deep Forest still provide
  // the progressive random-review pools.
  if (
    mapId === OVERWORLD_MAP_ID &&
    region === 'javascript' &&
    !progress.clearedStageIds.includes(3)
  ) {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  const rolls = encounterRolls ?? createEncounterRolls(rpgState, next.x, next.y, nextSteps)
  if (rolls.trigger >= getEncounterChance(terrain)) {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  const battleId =
    mapId === JS_DEEP_FOREST_MAP_ID
      ? getDeepForestReviewBattleId(progress.clearedStageIds, rolls.battle)
      : getEncounterBattleId(
          region,
          getCanonicalUnlockedStageIds(progress.clearedStageIds),
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
  if (!clearedStageIds.includes(7) && isBattleAccessible(7, clearedStageIds)) return 7
  if (!clearedStageIds.includes(8) && isBattleAccessible(8, clearedStageIds)) return 8
  if (!clearedStageIds.includes(9) && isBattleAccessible(9, clearedStageIds)) return 9
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
      kind: 'none'
    }

function resolveTreasureInteraction(rpgState: RpgState): WorldInteractionIntent | null {
  const treasure = WORLD_TREASURES.find(
    (candidate) =>
      candidate.mapId === rpgState.worldMapId &&
      isAdjacent(rpgState.worldPosition, candidate.position),
  )
  if (!treasure) return null

  return {
    kind: 'treasure',
    treasureId: treasure.id,
    opened: rpgState.openedTreasureIds.includes(treasure.id),
  }
}

export function resolveWorldInteraction(
  rpgState: RpgState,
  progress: PlayerProgress,
): WorldInteractionIntent {
  const position = rpgState.worldPosition
  const treasureInteraction = resolveTreasureInteraction(rpgState)
  if (treasureInteraction) return treasureInteraction

  if (rpgState.worldMapId === JS_VILLAGE_MAP_ID) {
    if (isAdjacent(position, JS_VILLAGE_TRAINING_POSITION)) {
      return {
        kind: 'training',
        battleId: getNextJavaScriptTrainingBattleId(progress.clearedStageIds),
      }
    }
    return { kind: 'none' }
  }

  if (rpgState.worldMapId === JS_FOREST_MAP_ID) {
    if (progress.clearedStageIds.includes(13)) return { kind: 'none' }
    if (isAdjacent(position, JS_FOREST_MIDBOSS_POSITION)) {
      return {
        kind: 'midboss',
        battleId: 13,
        region: 'javascript',
        unlocked: isBattleAccessible(13, progress.clearedStageIds),
        seed: `midboss:js-forest:${rpgState.encounterCount}`,
      }
    }
    return { kind: 'none' }
  }

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    if (isAdjacent(position, TS_BOSS_POSITION)) {
      return {
        kind: 'boss',
        battleId: 6,
        region: 'typescript',
        unlocked: isBattleAccessible(6, progress.clearedStageIds),
        seed: `boss:ts:${rpgState.encounterCount}`,
      }
    }

    return { kind: 'none' }
  }

  if (rpgState.worldMapId !== OVERWORLD_MAP_ID) return { kind: 'none' }

  if (isAdjacent(position, JS_VILLAGE_POSITION)) {
    const portal = getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_VILLAGE_POSITION)
    if (
      portal &&
      portal.toMapId === JS_VILLAGE_MAP_ID &&
      isWorldPortalRequirementSatisfied(portal.requiredClearedStageId, progress.clearedStageIds)
    ) {
      return {
        kind: 'map-transition',
        toMapId: portal.toMapId,
        label: portal.label,
        nextState: {
          ...rpgState,
          worldMapId: portal.toMapId,
          worldPosition: { ...portal.targetPosition },
          stepsSinceEncounter: rpgState.stepsSinceEncounter + 1,
        },
      }
    }
  }

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

  if (position.x === 30 && position.y === 18) {
    return {
      kind: 'treasure',
      treasureId: 'ts-supply-cache',
      opened: rpgState.openedTreasureIds.includes('ts-supply-cache'),
    }
  }

  if (isAdjacent(position, JS_BOSS_POSITION)) {
    return {
      kind: 'boss',
      battleId: 3,
      region: 'javascript',
      unlocked: isBattleAccessible(3, progress.clearedStageIds),
      seed: `boss:js:${rpgState.encounterCount}`,
    }
  }

  return { kind: 'none' }
}
