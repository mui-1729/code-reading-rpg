import { createInitialPlayerProgress, getPlayerStats } from '../progression/progression'
import type { BattleSessionSnapshot } from '../battle/sessionTransaction'
import { areas } from '../game/areas'
import { grantAreaClearEquipment } from '../rpg/areaRewards'
import {
  migrateStoredPlayerProgress,
  PLAYER_PROGRESS_STORAGE_KEY,
  restorePlayerProgress,
  serializePlayerProgress,
} from '../progression/storage'
import type { PlayerProgress } from '../progression/types'
import {
  createInitialRpgState,
  restoreRpgState,
  RPG_STORAGE_KEY,
  serializeRpgState,
  type RpgState,
} from '../rpg/state'
import { OVERWORLD_MAP_ID, WORLD_MAP_STARTS, WORLD_PORTALS } from '../world/worldMap'
import { isWorldPortalRequirementSatisfied } from '../world/worldPortalAccess'

export const GAME_STATE_STORAGE_KEY = 'code-reading-rpg:game-state'
export const GAME_STATE_BACKUP_STORAGE_KEY = 'code-reading-rpg:game-state-backup'
export const GAME_STATE_SCHEMA_VERSION = 2

export type GameStateSnapshot = {
  revision: number
  progress: PlayerProgress
  rpgState: RpgState
  battleSession?: BattleSessionSnapshot
}

export type GameStateWriteDecision =
  { kind: 'adopt'; snapshot: GameStateSnapshot } | { kind: 'commit'; snapshot: GameStateSnapshot }

type StoredGameState = {
  version: typeof GAME_STATE_SCHEMA_VERSION
  revision: number
  progress: unknown
  rpg: unknown
  battleSession: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function isCompleteStoredRpg(value: unknown): boolean {
  if (!isRecord(value) || ![1, 2, 3, 4, 5].includes(value.version as number)) return false
  const state = value.state
  if (!isRecord(state) || !isRecord(state.equipment) || !isRecord(state.worldPosition)) return false
  const isIdArray = (ids: unknown) =>
    Array.isArray(ids) && ids.every((id) => typeof id === 'string')
  if (
    !['weapon', 'armor', 'accessory'].every(
      (slot) =>
        state.equipment !== null &&
        typeof state.equipment === 'object' &&
        ((state.equipment as Record<string, unknown>)[slot] === null ||
          typeof (state.equipment as Record<string, unknown>)[slot] === 'string'),
    ) ||
    !isIdArray(state.ownedEquipmentIds) ||
    !isIdArray(state.partyMemberIds) ||
    !Number.isInteger(state.worldPosition.x) ||
    !Number.isInteger(state.worldPosition.y) ||
    !Number.isInteger(state.stepsSinceEncounter) ||
    !Number.isInteger(state.encounterCount)
  )
    return false
  const version = value.version as number
  if (version >= 2 && (typeof state.currentHp !== 'number' || !Number.isFinite(state.currentHp)))
    return false
  if (version >= 3 && !isIdArray(state.openedTreasureIds)) return false
  if (version >= 4 && typeof state.worldMapId !== 'string') return false
  return true
}

/**
 * World position is physical state, but access is progression state. Restore them
 * together so a legacy/partial save cannot strand the player inside a locked map.
 */
export function normalizeRpgStateForProgress(
  progress: PlayerProgress,
  rpgState: RpgState,
): RpgState {
  rpgState = grantAreaClearEquipment(progress, rpgState, areas)
  const reachable = new Set<string>([OVERWORLD_MAP_ID])
  let addedMap = true
  while (addedMap) {
    addedMap = false
    for (const portal of WORLD_PORTALS) {
      if (
        !reachable.has(portal.fromMapId) ||
        reachable.has(portal.toMapId) ||
        !isWorldPortalRequirementSatisfied(portal.requiredClearedStageId, progress.clearedStageIds)
      )
        continue
      reachable.add(portal.toMapId)
      addedMap = true
    }
  }

  if (!reachable.has(rpgState.worldMapId)) {
    return {
      ...rpgState,
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    }
  }

  return rpgState
}

function storedEnvelope(raw: string): unknown {
  return JSON.parse(raw) as unknown
}

export function serializeGameStateSnapshot(snapshot: GameStateSnapshot): string {
  const stored: StoredGameState = {
    version: GAME_STATE_SCHEMA_VERSION,
    revision: snapshot.revision,
    progress: storedEnvelope(serializePlayerProgress(snapshot.progress)),
    rpg: storedEnvelope(serializeRpgState(snapshot.rpgState)),
    battleSession: snapshot.battleSession
      ? {
          identity: snapshot.battleSession.identity,
          progress: storedEnvelope(serializePlayerProgress(snapshot.battleSession.progress)),
          rpg: storedEnvelope(serializeRpgState(snapshot.battleSession.rpgState)),
        }
      : null,
  }
  return JSON.stringify(stored)
}

export function parseGameStateSnapshot(raw: string | null): GameStateSnapshot | null {
  if (!raw) return null

  try {
    const stored: unknown = JSON.parse(raw)
    if (
      !isRecord(stored) ||
      (stored.version !== 1 && stored.version !== GAME_STATE_SCHEMA_VERSION) ||
      !Number.isSafeInteger(stored.revision) ||
      (stored.revision as number) < 0
    ) {
      return null
    }

    const progress = migrateStoredPlayerProgress(stored.progress)
    if (!progress || !isCompleteStoredRpg(stored.rpg)) return null

    const stats = getPlayerStats(progress.exp)
    const rpgState = normalizeRpgStateForProgress(
      progress,
      restoreRpgState(JSON.stringify(stored.rpg), stats.maxHp),
    )
    const snapshot: GameStateSnapshot = { revision: stored.revision as number, progress, rpgState }
    if (stored.version === 1) return snapshot
    if (stored.battleSession === null) return snapshot
    const session = stored.battleSession
    if (!isRecord(session) || !isRecord(session.identity)) return null
    const identity = session.identity
    if (
      typeof identity.id !== 'string' ||
      identity.id.length === 0 ||
      typeof identity.areaId !== 'string' ||
      identity.areaId.length === 0 ||
      !Number.isSafeInteger(identity.battleId) ||
      (identity.battleId as number) <= 0 ||
      typeof identity.seed !== 'string' ||
      identity.seed.length === 0 ||
      (identity.returnTo !== undefined && typeof identity.returnTo !== 'string')
    )
      return null
    const startProgress = migrateStoredPlayerProgress(session.progress)
    if (!startProgress || !isCompleteStoredRpg(session.rpg)) return null
    const startRpg = normalizeRpgStateForProgress(
      startProgress,
      restoreRpgState(JSON.stringify(session.rpg), getPlayerStats(startProgress.exp).maxHp),
    )
    snapshot.battleSession = {
      identity: {
        id: identity.id,
        areaId: identity.areaId,
        battleId: identity.battleId as number,
        seed: identity.seed,
        ...(identity.returnTo === undefined ? {} : { returnTo: identity.returnTo as string }),
      },
      progress: startProgress,
      rpgState: startRpg,
    }
    return snapshot
  } catch {
    return null
  }
}

export function resolveGameStateWrite(
  local: GameStateSnapshot,
  stored: GameStateSnapshot | null,
): GameStateWriteDecision {
  if (stored && stored.revision > local.revision) {
    return { kind: 'adopt', snapshot: stored }
  }

  return {
    kind: 'commit',
    snapshot: {
      ...local,
      revision: Math.max(local.revision, stored?.revision ?? 0) + 1,
    },
  }
}

export function restoreGameState(input: {
  currentRaw: string | null
  backupRaw: string | null
  legacyProgressRaw: string | null
  legacyRpgRaw: string | null
}): GameStateSnapshot {
  const current = parseGameStateSnapshot(input.currentRaw)
  const backup = parseGameStateSnapshot(input.backupRaw)
  const recovered = [current, backup]
    .filter((snapshot): snapshot is GameStateSnapshot => snapshot !== null)
    .sort((left, right) => right.revision - left.revision)[0]

  if (recovered) return recovered

  const progress = restorePlayerProgress(input.legacyProgressRaw)
  const stats = getPlayerStats(progress.exp)
  const rpgState = normalizeRpgStateForProgress(
    progress,
    input.legacyRpgRaw === null
      ? createInitialRpgState(stats.maxHp)
      : restoreRpgState(input.legacyRpgRaw, stats.maxHp),
  )

  return { revision: 0, progress, rpgState }
}

export function readGameStateFromStorage(storage: Pick<Storage, 'getItem'>): GameStateSnapshot {
  return restoreGameState({
    currentRaw: storage.getItem(GAME_STATE_STORAGE_KEY),
    backupRaw: storage.getItem(GAME_STATE_BACKUP_STORAGE_KEY),
    legacyProgressRaw: storage.getItem(PLAYER_PROGRESS_STORAGE_KEY),
    legacyRpgRaw: storage.getItem(RPG_STORAGE_KEY),
  })
}

/** The root setItem is the commit point; legacy keys are never authoritative afterwards. */
export function writeGameStateToStorage(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  local: GameStateSnapshot,
): GameStateWriteDecision {
  const currentRaw = storage.getItem(GAME_STATE_STORAGE_KEY)
  const current = parseGameStateSnapshot(currentRaw)
  if (
    currentRaw === null &&
    local.revision > 0 &&
    !parseGameStateSnapshot(storage.getItem(GAME_STATE_BACKUP_STORAGE_KEY))
  ) {
    // Another tab reset the save. Do not resurrect an old in-memory run before
    // that tab has had a chance to write its fresh revision.
    return {
      kind: 'adopt',
      snapshot: {
        revision: 0,
        progress: createInitialPlayerProgress(),
        rpgState: createInitialRpgState(),
      },
    }
  }
  const decision = resolveGameStateWrite(local, current)
  if (decision.kind === 'adopt') return decision

  if (currentRaw && current) storage.setItem(GAME_STATE_BACKUP_STORAGE_KEY, currentRaw)
  storage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(decision.snapshot))

  // Cleanup failure cannot roll back a successful root commit.
  try {
    storage.removeItem(PLAYER_PROGRESS_STORAGE_KEY)
    storage.removeItem(RPG_STORAGE_KEY)
  } catch {
    // A valid root always takes precedence over these migration-only inputs.
  }
  return decision
}
