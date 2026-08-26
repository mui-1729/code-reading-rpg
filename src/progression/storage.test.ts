import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './progression'
import {
  migrateStoredPlayerProgress,
  PLAYER_PROGRESS_SCHEMA_VERSION,
  restorePlayerProgress,
  serializePlayerProgress,
} from './storage'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

describe('player progress storage', () => {
  it('version付きschemaで複数AreaとSide Quest進行をserialize / restoreできる', () => {
    const progress = {
      exp: 520,
      clearedStageIds: [1, 2, 3, 4, 5, 6],
      clearedAreaIds: ['javascript', 'typescript'],
      completedSideQuestIds: ['javascript-second-pass'],
      unlockedStageIds: [1, 4, 2, 3, 5, 6],
      unlockedSkillIds: [
        ...initialSkills,
        'viper',
        'moon-edge',
        'ts-union',
        'ts-optional',
        'ts-narrow',
      ],
    }

    const raw = serializePlayerProgress(progress)
    const parsed = JSON.parse(raw)

    expect(parsed.version).toBe(PLAYER_PROGRESS_SCHEMA_VERSION)
    expect(parsed.progress).toEqual(progress)
    expect(restorePlayerProgress(raw)).toEqual(progress)
  })

  it('schema v1の保存データをArea未クリア・Side Quest未完了の現行progressへmigrationする', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 120,
        clearedStageIds: [1, 2],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual({
      exp: 120,
      clearedStageIds: [1, 2],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1, 4, 2, 3],
      unlockedSkillIds: [...initialSkills, 'viper', 'moon-edge'],
    })
  })

  it('schema v1ですでにBossを倒していた場合はJavaScript Area CLEARを引き継ぐ', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 220,
        clearedStageIds: [1, 2, 3],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedAreaIds).toEqual(['javascript'])
    expect(restored.completedSideQuestIds).toEqual([])
  })

  it('schema v2のsaveをSide Quest未完了のv3へmigrationする', () => {
    const raw = JSON.stringify({
      version: 2,
      progress: {
        exp: 220,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([1, 2, 3])
    expect(restored.clearedAreaIds).toEqual(['javascript'])
    expect(restored.completedSideQuestIds).toEqual([])
    expect(restored.unlockedStageIds).toEqual([1, 4, 2, 3])
    expect(restored.unlockedSkillIds).toEqual([...initialSkills, 'viper', 'moon-edge'])
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
        clearedAreaIds: [],
        completedSideQuestIds: [],
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
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: [],
        unlockedStageIds: [1],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })

  it('現行schemaはSide Quest進行を含む有効なPlayerProgressだけを受け入れる', () => {
    const stored = {
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 40,
        clearedStageIds: [1],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 2],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    }

    expect(migrateStoredPlayerProgress(stored)).toEqual({
      ...stored.progress,
      unlockedStageIds: [1, 4, 2],
      unlockedSkillIds: [...initialSkills, 'viper'],
    })
    expect(
      migrateStoredPlayerProgress({
        ...stored,
        progress: { ...stored.progress, completedSideQuestIds: [1] },
      }),
    ).toBeNull()
    expect(
      migrateStoredPlayerProgress({
        ...stored,
        progress: { ...stored.progress, clearedAreaIds: [1] },
      }),
    ).toBeNull()
  })

  it('現行schemaでSide Quest fieldが欠けていれば安全にfallbackする', () => {
    const raw = JSON.stringify({
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 220,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })
})
