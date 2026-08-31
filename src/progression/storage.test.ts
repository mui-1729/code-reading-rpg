import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './progression'
import {
  migrateStoredPlayerProgress,
  PLAYER_PROGRESS_SCHEMA_VERSION,
  restorePlayerProgress,
  serializePlayerProgress,
} from './storage'

const initialSkills = ['trace', 'pulse', 'nova']
const emptyEconomy = {
  gold: 0,
  inventory: { patchKit: 0 },
}
const completedJavaScriptStoryIds = [
  3, 1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22,
]
const unlockedAfterJavaScriptComplete = [
  1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3, 4,
]
const masteredAfterJavaScriptComplete = [
  ...initialSkills,
  'link',
  'fork',
  'gather',
  'viper',
  'lock',
  'alert',
  'echo',
  'project',
  'signal',
  'sweep',
  'sync',
  'order',
  'moon-edge',
  'safe-path',
  'reduce-focus',
  'judge',
]

describe('player progress storage', () => {
  it('v4 serialize / restore時にstage / Skill unlock cacheをcanonical stateへ正規化する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 520,
      gold: 75,
      inventory: { patchKit: 2 },
      // pre-#261 shapeを意図的に渡し、restore時のmigrationまで確認する。
      clearedStageIds: [7, 8, 9],
      clearedAreaIds: [],
      completedSideQuestIds: ['javascript-second-pass'],
      unlockedStageIds: [1, 3, 4, 7, 99],
      unlockedSkillIds: [...initialSkills, 'viper', 'ts-scan'],
    }

    const raw = serializePlayerProgress(progress)
    const parsed = JSON.parse(raw)

    expect(parsed.version).toBe(PLAYER_PROGRESS_SCHEMA_VERSION)
    expect(parsed.progress.unlockedStageIds).toEqual([1, 7, 8, 9])
    expect(parsed.progress.unlockedSkillIds).toEqual(initialSkills)

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([7, 8, 9, 1])
    expect(restored.unlockedStageIds).toEqual([1, 7, 8, 9, 10])
    expect(restored.unlockedSkillIds).toEqual(initialSkills)
    expect(restored.gold).toBe(75)
    expect(restored.inventory.patchKit).toBe(2)
  })

  it('schema v1をv4へmigrationし、不正なlegacy stage / Skill unlock bitを除去する', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 120,
        clearedStageIds: [1],
        unlockedStageIds: [1, 2, 3, 4, 99],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'ts-scan'],
      },
    })

    expect(restorePlayerProgress(raw)).toEqual({
      exp: 120,
      ...emptyEconomy,
      clearedStageIds: [1],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1, 7],
      unlockedSkillIds: initialSkills,
    })
  })

  it('旧routeでForestまで進んだsaveは最初のincidentと到達済みMASTERED Skillだけを補完する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 220,
        clearedStageIds: [7, 8, 9, 10, 11],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [12],
        unlockedSkillIds: ['trace'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([7, 8, 9, 10, 11, 1])
    expect(restored.unlockedStageIds).toContain(12)
    expect(restored.unlockedSkillIds).toEqual(
      expect.arrayContaining(['link', 'fork']),
    )
    expect(restored.unlockedSkillIds).not.toContain('lock')
    expect(restored.unlockedSkillIds).not.toContain('alert')
  })

  it('旧routeでDeep Forestまで進んだsaveは両incidentと到達済みmasteryを補完する', () => {
    const raw = JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        clearedAreaIds: [],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [17],
        unlockedSkillIds: ['trace'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 1, 2])
    expect(restored.unlockedStageIds).toContain(17)
    expect(restored.unlockedSkillIds).toEqual(
      expect.arrayContaining(['gather', 'viper', 'lock', 'alert', 'echo', 'project']),
    )
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
        unlockedSkillIds: ['trace'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedStageIds).toContain(1)
    expect(restored.clearedStageIds).toContain(2)
    expect(restored.unlockedStageIds).toContain(3)
    expect(restored.unlockedSkillIds).toEqual(
      expect.arrayContaining(['order', 'moon-edge', 'safe-path', 'reduce-focus', 'judge']),
    )
  })

  it('schema v1でBoss撃破済みならJavaScript Area CLEARと現行story / mastery全体を引き継ぐ', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        exp: 220,
        clearedStageIds: [3],
        unlockedStageIds: [1, 2, 3, 4],
        unlockedSkillIds: ['trace'],
      },
    })

    const restored = restorePlayerProgress(raw)
    expect(restored.clearedAreaIds).toEqual(['javascript'])
    expect(restored.clearedStageIds).toEqual(completedJavaScriptStoryIds)
    expect(restored.gold).toBe(0)
    expect(restored.inventory.patchKit).toBe(0)
    expect(restored.unlockedStageIds).toEqual(unlockedAfterJavaScriptComplete)
    expect(restored.unlockedSkillIds).toEqual(masteredAfterJavaScriptComplete)
  })

  it('schema v2 / v3のArea・Side Quest進行を維持し、Boss clear済みなら現行storyを補完する', () => {
    const v2 = restorePlayerProgress(JSON.stringify({
      version: 2,
      progress: {
        exp: 220,
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [4],
        unlockedSkillIds: ['trace'],
      },
    }))
    expect(v2.clearedAreaIds).toEqual(['javascript'])
    expect(v2.completedSideQuestIds).toEqual([])
    expect(v2.clearedStageIds).toEqual(completedJavaScriptStoryIds)
    expect(v2.unlockedStageIds).toEqual(unlockedAfterJavaScriptComplete)
    expect(v2.unlockedSkillIds).toEqual(masteredAfterJavaScriptComplete)

    const v3 = restorePlayerProgress(JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [4],
        unlockedSkillIds: ['trace'],
      },
    }))
    expect(v3.completedSideQuestIds).toEqual(['javascript-second-pass'])
    expect(v3.clearedStageIds).toEqual(completedJavaScriptStoryIds)
    expect(v3.unlockedStageIds).toEqual(unlockedAfterJavaScriptComplete)
    expect(v3.unlockedSkillIds).toEqual(masteredAfterJavaScriptComplete)
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
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'ts-scan'],
      },
    }

    expect(migrateStoredPlayerProgress(stored)).toEqual({
      ...stored.progress,
      unlockedStageIds: [1, 7],
      unlockedSkillIds: initialSkills,
    })
  })

  it('forged clear bit単体では後半Skill masteryを得られない', () => {
    const stored = {
      version: PLAYER_PROGRESS_SCHEMA_VERSION,
      progress: {
        exp: 40,
        gold: 0,
        inventory: { patchKit: 0 },
        clearedStageIds: [14],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [15],
        unlockedSkillIds: ['gather', 'viper'],
      },
    }

    const restored = migrateStoredPlayerProgress(stored)
    expect(restored?.unlockedSkillIds).toEqual(initialSkills)
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
