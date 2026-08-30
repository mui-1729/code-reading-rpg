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
  it('v4 serialize / restore時にstage unlock cacheをcanonical graphへ正規化する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 520,
      gold: 75,
      inventory: { patchKit: 2 },
      clearedStageIds: [7, 8, 9],
      clearedAreaIds: [],
      completedSideQuestIds: ['javascript-second-pass'],
      unlockedStageIds: [1, 3, 4, 7, 99],
      unlockedSkillIds: [...initialSkills, 'viper'],
    }

    const raw = serializePlayerProgress(progress)
    const parsed = JSON.parse(raw)

    expect(parsed.version).toBe(PLAYER_PROGRESS_SCHEMA_VERSION)
    expect(parsed.progress.unlockedStageIds).toEqual([7, 8, 9, 1])
    expect(restorePlayerProgress(raw).unlockedStageIds).toEqual([7, 8, 9, 1])
    expect(restorePlayerProgress(raw).gold).toBe(75)
    expect(restorePlayerProgress(raw).inventory.patchKit).toBe(2)
  })

  it('schema v1をv4へmigrationし、不正なlegacy unlock bitをcanonical graphで除去する', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 120,
        clearedStageIds: [1],
        unlockedStageIds: [1, 2, 3, 4, 99],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual({
      exp: 120,
      ...emptyEconomy,
      clearedStageIds: [1],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [7, 1],
      unlockedSkillIds: [...initialSkills, 'viper'],
    })
  })

  it('旧routeでForestまで進んだsaveは最初のincidentを通過済みとして補完する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 220,
        clearedStageIds: [7, 8, 9, 10, 11],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [12],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'link', 'fork'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([7, 8, 9, 10, 11, 1])
    expect(restored.unlockedStageIds).toContain(12)
  })

  it('旧routeでDeep Forestまで進んだsaveは両incidentを通過済みとして補完する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        clearedAreaIds: [],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [17],
        unlockedSkillIds: ['trace', 'pulse', 'nova'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 1, 2])
    expect(restored.unlockedStageIds).toContain(17)
    expect(restored.completedSideQuestIds).toEqual(['javascript-second-pass'])
  })

  it('旧routeでBattle 22まで進んだsaveはFinalへ戻り道なしで進めるよう両incidentを補完する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 620,
        clearedStageIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1],
        unlockedSkillIds: ['trace', 'pulse', 'nova'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toContain(1)
    expect(restored.clearedStageIds).toContain(2)
    expect(restored.unlockedStageIds).toContain(3)
  })

  it('schema v1でBoss撃破済みならJavaScript Area CLEARとincident historyを引き継ぐ', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 220,
        clearedStageIds: [3],
        unlockedStageIds: [1, 2, 3, 4],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedAreaIds).toEqual(['javascript'])
    expect(restored.clearedStageIds).toEqual([3, 1, 2])
    expect(restored.gold).toBe(0)
    expect(restored.inventory.patchKit).toBe(0)
    expect(restored.unlockedStageIds).toEqual([7, 1, 2, 3, 4])
  })

  it('schema v2 / v3のArea・Side Quest進行を維持する', () => {
    const v2 = restorePlayerProgress(JSON.stringify({
      version: 2,
      progress: {
        exp: 220,
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [4],
        unlockedSkillIds: ['trace', 'pulse', 'nova'],
      },
    }))
    expect(v2.clearedAreaIds).toEqual(['javascript'])
    expect(v2.completedSideQuestIds).toEqual([])
    expect(v2.clearedStageIds).toEqual([3, 1, 2])
    expect(v2.unlockedStageIds).toEqual([7, 1, 2, 3, 4])

    const v3 = restorePlayerProgress(JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [4],
        unlockedSkillIds: ['trace', 'pulse', 'nova'],
      },
    }))
    expect(v3.completedSideQuestIds).toEqual(['javascript-second-pass'])
    expect(v3.clearedStageIds).toEqual([3, 1, 2])
    expect(v3.unlockedStageIds).toEqual([7, 1, 2, 3, 4])
  })

  it('保存データがない場合は初期状態へfallbackする', () => {
    expect(restorePlayerProgress(null)).toEqual(createInitialPlayerProgress())
  })

  it('壊れたJSONではクラッシュせず初期状態へfallbackする', () => {
    expect(restorePlayerProgress('{not-json')).toEqual(createInitialPlayerProgress())
  })

  it('未知schema versionでは初期状態へfallbackする', () => {
    const raw = JSON.stringify({ version: 999, progress: {} })
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

  it('現行schemaでもstored unlock bitをauthorityにしない', () => {
    const stored = {
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 40,
        gold: 35,
        inventory: { patchKit: 1 },
        clearedStageIds: [1],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 2, 3, 4, 99],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
      },
    }

    expect(migrateStoredPlayerProgress(stored)).toEqual({
      ...stored.progress,
      unlockedStageIds: [7, 1],
      unlockedSkillIds: [...initialSkills, 'viper'],
    })
  })

  it('現行schemaでEconomy fieldが欠けていれば安全にfallbackする', () => {
    const raw = JSON.stringify({
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 220,
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: [],
        unlockedStageIds: [4],
        unlockedSkillIds: ['trace'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual(createInitialPlayerProgress())
  })
})