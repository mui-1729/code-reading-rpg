import { createInitialPlayerProgress } from './progression'
import type { PlayerProgress } from './types'

export const PLAYER_PROGRESS_STORAGE_KEY = 'code-reading-rpg:player-progress'
export const PLAYER_PROGRESS_SCHEMA_VERSION = 1

export type StoredPlayerProgressV1 = {
  version: typeof PLAYER_PROGRESS_SCHEMA_VERSION
  progress: PlayerProgress
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStageIdArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => Number.isInteger(item) && item > 0)

const isSkillIdArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0)

function parsePlayerProgress(value: unknown): PlayerProgress | null {
  if (!isRecord(value)) return null
  if (typeof value.exp !== 'number' || !Number.isInteger(value.exp) || value.exp < 0) return null
  if (!isStageIdArray(value.clearedStageIds)) return null
  if (!isStageIdArray(value.unlockedStageIds)) return null
  if (!isSkillIdArray(value.unlockedSkillIds)) return null

  return {
    exp: value.exp,
    clearedStageIds: [...value.clearedStageIds],
    unlockedStageIds: [...value.unlockedStageIds],
    unlockedSkillIds: [...value.unlockedSkillIds],
  }
}

export function migrateStoredPlayerProgress(value: unknown): PlayerProgress | null {
  if (!isRecord(value)) return null

  switch (value.version) {
    case PLAYER_PROGRESS_SCHEMA_VERSION:
      return parsePlayerProgress(value.progress)
    default:
      return null
  }
}

export function serializePlayerProgress(progress: PlayerProgress): string {
  const stored: StoredPlayerProgressV1 = {
    version: PLAYER_PROGRESS_SCHEMA_VERSION,
    progress: {
      exp: progress.exp,
      clearedStageIds: [...progress.clearedStageIds],
      unlockedStageIds: [...progress.unlockedStageIds],
      unlockedSkillIds: [...progress.unlockedSkillIds],
    },
  }

  return JSON.stringify(stored)
}

export function restorePlayerProgress(raw: string | null): PlayerProgress {
  if (raw === null) return createInitialPlayerProgress()

  try {
    const parsed: unknown = JSON.parse(raw)
    return migrateStoredPlayerProgress(parsed) ?? createInitialPlayerProgress()
  } catch {
    return createInitialPlayerProgress()
  }
}
