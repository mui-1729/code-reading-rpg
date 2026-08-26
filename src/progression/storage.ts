import { createInitialPlayerProgress } from './progression'
import type { PlayerProgress } from './types'

export const PLAYER_PROGRESS_STORAGE_KEY = 'code-reading-rpg:player-progress'
export const PLAYER_PROGRESS_SCHEMA_VERSION = 3

const V1_JAVASCRIPT_BOSS_STAGE_ID = 3
const V1_JAVASCRIPT_AREA_ID = 'javascript'

export type StoredPlayerProgressV1 = {
  version: 1
  progress: {
    exp: number
    clearedStageIds: number[]
    unlockedStageIds: number[]
    unlockedSkillIds: string[]
  }
}

export type StoredPlayerProgressV2 = {
  version: 2
  progress: {
    exp: number
    clearedStageIds: number[]
    clearedAreaIds: string[]
    unlockedStageIds: number[]
    unlockedSkillIds: string[]
  }
}

export type StoredPlayerProgressV3 = {
  version: typeof PLAYER_PROGRESS_SCHEMA_VERSION
  progress: PlayerProgress
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStageIdArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => Number.isInteger(item) && item > 0)

const isStringIdArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0)

const mergeUnique = <T,>(baseline: readonly T[], stored: readonly T[]): T[] => [
  ...new Set([...baseline, ...stored]),
]

function parseCommonProgressFields(value: unknown) {
  if (!isRecord(value)) return null
  if (typeof value.exp !== 'number' || !Number.isInteger(value.exp) || value.exp < 0) return null
  if (!isStageIdArray(value.clearedStageIds)) return null
  if (!isStageIdArray(value.unlockedStageIds)) return null
  if (!isStringIdArray(value.unlockedSkillIds)) return null

  const baseline = createInitialPlayerProgress()

  return {
    exp: value.exp,
    clearedStageIds: [...value.clearedStageIds],
    unlockedStageIds: mergeUnique(baseline.unlockedStageIds, value.unlockedStageIds),
    unlockedSkillIds: mergeUnique(baseline.unlockedSkillIds, value.unlockedSkillIds),
  }
}

function parsePlayerProgressV2(value: unknown): PlayerProgress | null {
  const common = parseCommonProgressFields(value)
  if (!common || !isRecord(value) || !isStringIdArray(value.clearedAreaIds)) return null

  return {
    ...common,
    clearedAreaIds: [...value.clearedAreaIds],
    completedSideQuestIds: [],
  }
}

function parsePlayerProgressV3(value: unknown): PlayerProgress | null {
  const common = parseCommonProgressFields(value)
  if (
    !common ||
    !isRecord(value) ||
    !isStringIdArray(value.clearedAreaIds) ||
    !isStringIdArray(value.completedSideQuestIds)
  ) {
    return null
  }

  return {
    ...common,
    clearedAreaIds: [...value.clearedAreaIds],
    completedSideQuestIds: [...value.completedSideQuestIds],
  }
}

function migrateV1Progress(value: unknown): PlayerProgress | null {
  const common = parseCommonProgressFields(value)
  if (!common) return null

  const clearedAreaIds = common.clearedStageIds.includes(V1_JAVASCRIPT_BOSS_STAGE_ID)
    ? [V1_JAVASCRIPT_AREA_ID]
    : []

  return {
    ...common,
    clearedAreaIds,
    completedSideQuestIds: [],
  }
}

export function migrateStoredPlayerProgress(value: unknown): PlayerProgress | null {
  if (!isRecord(value)) return null

  switch (value.version) {
    case 1:
      return migrateV1Progress(value.progress)
    case 2:
      return parsePlayerProgressV2(value.progress)
    case PLAYER_PROGRESS_SCHEMA_VERSION:
      return parsePlayerProgressV3(value.progress)
    default:
      return null
  }
}

export function serializePlayerProgress(progress: PlayerProgress): string {
  const stored: StoredPlayerProgressV3 = {
    version: PLAYER_PROGRESS_SCHEMA_VERSION,
    progress: {
      exp: progress.exp,
      clearedStageIds: [...progress.clearedStageIds],
      clearedAreaIds: [...progress.clearedAreaIds],
      completedSideQuestIds: [...progress.completedSideQuestIds],
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
