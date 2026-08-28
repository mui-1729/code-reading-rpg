import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './progression'
import {
  migrateStoredPlayerProgress,
  PLAYER_PROGRESS_SCHEMA_VERSION,
  restorePlayerProgress,
  serializePlayerProgress,
} from './storage'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']
const emptyEconomy = {
  gold: 0,
  inventory: { patchKit: 0 },
}

describe('player progress storage', () => {
  it('v4 schemaでGold・Inventoryを含む進行をserialize / restoreできる', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 520,
      gold: 75,
      inventory: { patchKit: 2 },
      clearedStageIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      clearedAreaIds: ['javascript', 'typescript'],
      completedSideQuestIds: ['javascript-second-pass'],
      unlockedStageIds: [1, 4, 7, 2, 3, 5, 6, 8, 9],
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

  it('schema v1をv4へmigrationし、既存進行を維持してTraining 7を追加する', () => {
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
      ...emptyEconomy,
      clearedStageIds: [1, 2],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1, 4, 7, 2, 3],
      unlockedSkillIds: [...initialSkills, 'viper', 'moon-edge'],
    })
  })

  it('schema v1でBoss撃破済みならJavaScript Area CLEARを引き継ぐ', () => {
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
    expect(restored.gold).toBe(0)
    expect(restored.inventory.patchKit).toBe(0)
    expect(restored.unlockedStageIds).toContain(7)
  })

  it('schema v2をv4へmigrationし、Area進行を維持してTraining 7を追加する', () => {
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
    expect(restored.gold).toBe(0)
    expect(restored.inventory.patchKit).toBe(0)
    expect(restored.unlockedStageIds).toEqual([1, 4, 7, 2, 3])
    expect(restored.unlockedSkillIds).toEqual([...initialSkills, 'viper', 'moon-edge'])
  })

  it('schema v3をv4へmigrationし、Side Quest進行を維持してTraining 7を追加する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.exp).toBe(320)
    expect(restored.clearedAreaIds).toEqual(['javascript'])
    expect(restored.completedSideQuestIds).toEqual(['javascript-second-pass'])
    expect(restored.gold).toBe(0)
    expect(restored.inventory.patchKit).toBe(0)
    expect(restored.unlockedStageIds).toContain(7)
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
        gold: 10,
        inventory: { patchKit: 1 },
        clearedStageIds: [1, 2],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })

  it('不正なv4 PlayerProgress構造では初期状態へfallbackする', () => {
    const raw = JSON.stringify({
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: -1,
        gold: -1,
        inventory: { patchKit: -1 },
        clearedStageIds: ['1'],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: [],
        unlockedStageIds: [1],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })

  it('現行schemaはGold・Inventoryを含む有効なPlayerProgressだけを受け入れTraining 7を補う', () => {
    const stored = {
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 40,
        gold: 35,
        inventory: { patchKit: 1 },
        clearedStageIds: [1],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 2],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    }

    expect(migrateStoredPlayerProgress(stored)).toEqual({
      ...stored.progress,
      unlockedStageIds: [1, 4, 7, 2],
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
        progress: { ...stored.progress, inventory: { patchKit: -1 } },
      }),
    ).toBeNull()
  })

  it('現行schemaでEconomy fieldが欠けていれば安全にfallbackする', () => {
    const raw = JSON.stringify({
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 220,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })
})
