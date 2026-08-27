import { createSeededRandom } from '../game/random'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import {
  BYTE_POSITION,
  getEncounterBattleId,
  getEncounterChance,
  getTerrain,
  getWorldRegion,
  isAdjacent,
  isEncounterTerrain,
  isWalkableTerrain,
  JS_BOSS_POSITION,
  RECOVERY_POSITION,
  SHOP_POSITION,
  TS_BOSS_POSITION,
  WORLD_TREASURES,
  type Terrain,
  type WorldRegion,
  type WorldTreasureId,
} from './worldMap'

type BattleRegion = Exclude<WorldRegion, 'hub'>

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
  const seedBase = `${rpgState.encounterCount}:${nextX}:${nextY}:${nextSteps}`
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
  const terrain = getTerrain(next.x, next.y)

  if (!isWalkableTerrain(terrain)) {
    return { kind: 'blocked', nextState: rpgState, terrain }
  }

  const nextSteps = rpgState.stepsSinceEncounter + 1
  const region = getWorldRegion(next.x)
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

  return {
    kind: 'encounter',
    nextState: encounterState,
    terrain,
    region,
    battle: {
      battleId,
      region,
      seed: `encounter:${encounterNumber}:${next.x}:${next.y}`,
    },
  }
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

  const treasure = WORLD_TREASURES.find((candidate) => isAdjacent(position, candidate.position))
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
