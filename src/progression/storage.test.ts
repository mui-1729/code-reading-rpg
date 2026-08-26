import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './progression'
import {
  migrateStoredPlayerProgress,
  PLAYER_PROGRESS_SCHEMA_VERSION,
  restorePlayerProgress,
  serializePlayerProgress,
} from './storage'

describe('player progress storage', () => {
  it('version付きschemaで進行をserialize / restoreできる', () => {
    const progress = {
      exp: 120,
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 2, 3],
      unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
    }

    const raw = serializePlayerProgress(progress)
    const parsed = JSON.parse(raw)

    expect(parsed.version).toBe(PLAYER_PROGRESS_SCHEMA_VERSION)
    expect(parsed.progress).toEqual(progress)
    expect(restorePlayerProgress(raw)).toEqual(progress)
  })

  it('保存データがない場合は初期状態へfallbackする', () => {
    expect(restorePlayerProgress(null)).toEqual(createInitialPlayerProgress())
  })

  it('壊れたJSONではクラッシュせず初期状態へfallbackする', () => {
    expect(restorePlayerProgress('{not-json')).toEqual(createInitialPlayerProgress())
  })

  it('未知schema versionでは初期状態へfallbackする', () => {
    const raw = JSON.stringify({
      version: 999,
      progress: {
        exp: 120,
        clearedStageIds: [1, 2],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })

  it('不正なPlayerProgress構造では初期状態へfallbackする', () => {
    const raw = JSON.stringify({
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: -1,
        clearedStageIds: ['1'],
        unlockedStageIds: [1],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })

  it('migrationは有効な現行schemaだけをPlayerProgressへ変換する', () => {
    const stored = {
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 40,
        clearedStageIds: [1],
        unlockedStageIds: [1, 2],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    }

    expect(migrateStoredPlayerProgress(stored)).toEqual(stored.progress)
    expect(migrateStoredPlayerProgress({ version: 2, progress: stored.progress })).toBeNull()
  })
})
