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
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_FOREST_MIDBOSS_POSITION,
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
type JavaScriptLearningBattleId = 10 | 11 | 12 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22

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
  if (mapId !== JS_FOREST_MAP_ID || !clearedStageIds.includes(9)) return null

  // 新conceptはRandom Encounterではなく、東から西へ進む固定Lessonで順番に導入する。
  // 中Boss後のfilter()も、守り人を突破して西側のWoodsへ入ってから初登場させる。
  if (!clearedStageIds.includes(10)) return 10
  if (!clearedStageIds.includes(11) && position.x <= 17) return 11
  if (!clearedStageIds.includes(12) && position.x <= 8) return 12
  if (!clearedStageIds.includes(13)) return null
  if (!clearedStageIds.includes(14) && position.x <= 4) return 14
  return null
}

function getDeepForestLearningBattleId(
  mapId: WorldMapId,
  position: { x: number; y: number },
  clearedStageIds: readonly number[],
): JavaScriptLearningBattleId | null {
  if (mapId !== JS_DEEP_FOREST_MAP_ID || !clearedStageIds.includes(14)) return null

  if (!clearedStageIds.includes(15)) return 15
  if (!clearedStageIds.includes(16) && position.x <= 24) return 16
  if (!clearedStageIds.includes(17) && position.x <= 19) return 17
  if (!clearedStageIds.includes(18) && position.x <= 14) return 18

  // 第二MID BOSSもnew syntaxを持たない固定Battleとして扱う。
  if (!clearedStageIds.includes(19) && position.x <= 10) return 19

  // 第二MID BOSSの先を最深部として、advanced syntaxを順番に固定導入する。
  if (!clearedStageIds.includes(20) && position.x <= 9) return 20
  if (!clearedStageIds.includes(21) && position.x <= 7) return 21
  if (!clearedStageIds.includes(22) && position.x <= 5) return 22
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

function createJavaScriptLessonEncounter(
  rpgState: RpgState,
  movedState: RpgState,
  next: { x: number; y: number },
  battleId: JavaScriptLearningBattleId,
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

  if (isEncounterTerrain(terrain)) {
    const lessonBattleId =
      getForestLearningBattleId(mapId, next, progress.clearedStageIds) ??
      getDeepForestLearningBattleId(mapId, next, progress.clearedStageIds)
    if (lessonBattleId !== null) {
      return createJavaScriptLessonEncounter(rpgState, movedState, next, lessonBattleId)
    }
  }

  if (!isEncounterTerrain(terrain) || nextSteps < 5 || region === 'hub') {
    return { kind: 'moved', nextState: movedState, terrain, region }
  }

  // 旧main Battle 1 / 2はJavaScript学習routeを最後まで終えてから最終異変として再接続する。
  if (
    mapId === OVERWORLD_MAP_ID &&
    region === 'javascript' &&
    !progress.clearedStageIds.includes(22)
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

  if (rpgState.worldMapId === JS_FOREST_MAP_ID) {
    if (progress.clearedStageIds.includes(13)) return { kind: 'none' }
    if (isAdjacent(position, JS_FOREST_MIDBOSS_POSITION)) {
      return {
        kind: 'midboss',
        battleId: 13,
        region: 'javascript',
        unlocked: progress.clearedStageIds.includes(12),
        seed: `midboss:js-forest:${rpgState.encounterCount}`,
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
      unlocked:
        progress.clearedStageIds.includes(22) &&
        progress.clearedStageIds.includes(1) &&
        progress.clearedStageIds.includes(2),
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
