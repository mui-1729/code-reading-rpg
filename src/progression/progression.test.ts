import { describe, expect, it } from 'vitest'
import {
  addExp,
  applyBattleVictory,
  createInitialPlayerProgress,
  getBattleGoldReward,
  getLevelForExp,
  getMaxHpForLevel,
  getPlayerStats,
  getPowerMultiplierForLevel,
  getSkillPowerForLevel,
  getTotalExpForLevel,
  REPLAY_GOLD_MULTIPLIER,
} from './progression'

describe('player progression', () => {
  it('初期進行はLv1相当で各Areaの入口StageとVillage Trainingだけを解放する', () => {
    const progress = createInitialPlayerProgress()

    expect(progress).toEqual({
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds: [],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1, 4, 7],
      unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
    })
    expect(getPlayerStats(progress.exp)).toEqual({
      level: 1,
      maxHp: 100,
      powerMultiplier: 1,
    })
  })

  it('Level到達に必要な累計EXPを計算する', () => {
    expect(getTotalExpForLevel(1)).toBe(0)
    expect(getTotalExpForLevel(2)).toBe(40)
    expect(getTotalExpForLevel(3)).toBe(120)
    expect(getTotalExpForLevel(4)).toBe(240)
  })

  it('EXP境界でLevelが正しく切り替わる', () => {
    expect(getLevelForExp(0)).toBe(1)
    expect(getLevelForExp(39)).toBe(1)
    expect(getLevelForExp(40)).toBe(2)
    expect(getLevelForExp(119)).toBe(2)
    expect(getLevelForExp(120)).toBe(3)
    expect(getLevelForExp(239)).toBe(3)
    expect(getLevelForExp(240)).toBe(4)
  })

  it('Levelごとに最大HPとPOWER倍率が小幅に成長する', () => {
    expect(getMaxHpForLevel(1)).toBe(100)
    expect(getMaxHpForLevel(2)).toBe(108)
    expect(getMaxHpForLevel(3)).toBe(116)

    expect(getPowerMultiplierForLevel(1)).toBe(1)
    expect(getPowerMultiplierForLevel(2)).toBeCloseTo(1.02)
    expect(getPowerMultiplierForLevel(3)).toBeCloseTo(1.04)
  })

  it('Skill POWERはLevel倍率を適用して実ダメージ用の整数へ丸める', () => {
    expect(getSkillPowerForLevel(34, 1)).toBe(34)
    expect(getSkillPowerForLevel(34, 2)).toBe(35)
    expect(getSkillPowerForLevel(62, 2)).toBe(63)
    expect(getSkillPowerForLevel(72, 3)).toBe(75)
  })

  it('Skill POWERは負値を0へ正規化する', () => {
    expect(getSkillPowerForLevel(-10, 5)).toBe(0)
  })

  it('EXP追加は元の進行データを変更しない', () => {
    const progress = createInitialPlayerProgress()
    const next = addExp(progress, 40)

    expect(next.exp).toBe(40)
    expect(getPlayerStats(next.exp).level).toBe(2)
    expect(progress.exp).toBe(0)
  })

  it('負のEXP追加では進行を巻き戻さない', () => {
    const progress = addExp(createInitialPlayerProgress(), 40)
    const next = addExp(progress, -10)

    expect(next.exp).toBe(40)
  })

  it('負のEXPやLevelを安全な最小値へ正規化する', () => {
    expect(getLevelForExp(-100)).toBe(1)
    expect(getTotalExpForLevel(-3)).toBe(0)
    expect(getMaxHpForLevel(0)).toBe(100)
    expect(getPowerMultiplierForLevel(0)).toBe(1)
  })

  it('Stage初回クリアでEXP・Gold・CLEAR・次Stage・Skillをまとめて更新する', () => {
    const initial = createInitialPlayerProgress()
    const result = applyBattleVictory(initial, {
      stageId: 1,
      expReward: 40,
      goldReward: 20,
      nextStageId: 2,
      unlockSkillId: 'viper',
    })

    expect(result.progress).toEqual({
      exp: 40,
      gold: 20,
      inventory: { patchKit: 0 },
      clearedStageIds: [1],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1, 4, 7, 2],
      unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label', 'viper'],
    })
    expect(result.reward).toEqual({
      expGained: 40,
      goldGained: 20,
      previousLevel: 1,
      newLevel: 2,
      firstClear: true,
      unlockedStageId: 2,
      unlockedSkillId: 'viper',
      clearedAreaId: undefined,
    })
    expect(initial).toEqual(createInitialPlayerProgress())
  })

  it('Village Training 7→8→9は低EXP・Gold 0のままForest 10へつなぐ', () => {
    const initial = createInitialPlayerProgress()
    const first = applyBattleVictory(initial, {
      stageId: 7,
      expReward: 8,
      goldReward: 0,
      nextStageId: 8,
    })

    expect(first.progress.exp).toBe(8)
    expect(first.progress.gold).toBe(0)
    expect(first.progress.clearedStageIds).toEqual([7])
    expect(first.progress.unlockedStageIds).toEqual([1, 4, 7, 8])
    expect(first.reward.unlockedStageId).toBe(8)
    expect(first.reward.newLevel).toBe(1)

    const second = applyBattleVictory(first.progress, {
      stageId: 8,
      expReward: 8,
      goldReward: 0,
      nextStageId: 9,
    })
    expect(second.progress.exp).toBe(16)
    expect(second.progress.gold).toBe(0)
    expect(second.progress.clearedStageIds).toEqual([7, 8])
    expect(second.progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9])
    expect(second.reward.unlockedStageId).toBe(9)

    const third = applyBattleVictory(second.progress, {
      stageId: 9,
      expReward: 8,
      goldReward: 0,
      nextStageId: 10,
    })
    expect(third.progress.exp).toBe(24)
    expect(third.progress.gold).toBe(0)
    expect(third.progress.clearedStageIds).toEqual([7, 8, 9])
    expect(third.progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9, 10])
    expect(third.reward.unlockedStageId).toBe(10)
  })

  it('Forest 10→11→12はLINK / FORKを順に解放して学習routeを完了する', () => {
    const initial = {
      ...createInitialPlayerProgress(),
      exp: 24,
      clearedStageIds: [7, 8, 9],
      unlockedStageIds: [1, 4, 7, 8, 9, 10],
    }

    const andResult = applyBattleVictory(initial, {
      stageId: 10,
      expReward: 16,
      goldReward: 6,
      nextStageId: 11,
      unlockSkillId: 'link',
    })
    expect(andResult.progress.exp).toBe(40)
    expect(andResult.progress.gold).toBe(6)
    expect(andResult.progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9, 10, 11])
    expect(andResult.progress.unlockedSkillIds).toContain('link')
    expect(andResult.reward.unlockedSkillId).toBe('link')

    const orResult = applyBattleVictory(andResult.progress, {
      stageId: 11,
      expReward: 20,
      goldReward: 8,
      nextStageId: 12,
      unlockSkillId: 'fork',
    })
    expect(orResult.progress.exp).toBe(60)
    expect(orResult.progress.gold).toBe(14)
    expect(orResult.progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9, 10, 11, 12])
    expect(orResult.progress.unlockedSkillIds).toEqual(expect.arrayContaining(['link', 'fork']))

    const combinedResult = applyBattleVictory(orResult.progress, {
      stageId: 12,
      expReward: 24,
      goldReward: 10,
    })
    expect(combinedResult.progress.exp).toBe(84)
    expect(combinedResult.progress.gold).toBe(24)
    expect(combinedResult.progress.clearedStageIds).toEqual([7, 8, 9, 10, 11, 12])
  })

  it('再クリアはEXPを再獲得しGoldだけ50%へ減衰、CLEARやunlockは重複させない', () => {
    const first = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: 1,
      expReward: 40,
      goldReward: 20,
      nextStageId: 2,
      unlockSkillId: 'viper',
    })
    const replay = applyBattleVictory(first.progress, {
      stageId: 1,
      expReward: 40,
      goldReward: 20,
      nextStageId: 2,
      unlockSkillId: 'viper',
    })

    expect(REPLAY_GOLD_MULTIPLIER).toBe(0.5)
    expect(replay.progress.exp).toBe(80)
    expect(replay.progress.gold).toBe(30)
    expect(replay.progress.clearedStageIds).toEqual([1])
    expect(replay.progress.clearedAreaIds).toEqual([])
    expect(replay.progress.completedSideQuestIds).toEqual([])
    expect(replay.progress.unlockedStageIds).toEqual([1, 4, 7, 2])
    expect(replay.progress.unlockedSkillIds).toEqual([
      'trace',
      'pulse',
      'nova',
      'ts-scan',
      'ts-guard',
      'ts-label',
      'viper',
    ])
    expect(replay.reward).toEqual({
      expGained: 40,
      goldGained: 10,
      previousLevel: 2,
      newLevel: 2,
      firstClear: false,
      unlockedStageId: undefined,
      unlockedSkillId: undefined,
      clearedAreaId: undefined,
    })
  })

  it('replay Goldは端数を切り捨て、負のrewardは0へ正規化する', () => {
    expect(getBattleGoldReward(25, true)).toBe(25)
    expect(getBattleGoldReward(25, false)).toBe(12)
    expect(getBattleGoldReward(-10, false)).toBe(0)
  })

  it('Boss初回クリアでArea CLEARを記録する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 120,
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 2, 3],
      unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
    }
    const result = applyBattleVictory(progress, {
      stageId: 3,
      expReward: 100,
      clearAreaId: 'javascript',
    })

    expect(result.progress.exp).toBe(220)
    expect(result.progress.clearedStageIds).toEqual([1, 2, 3])
    expect(result.progress.clearedAreaIds).toEqual(['javascript'])
    expect(result.progress.completedSideQuestIds).toEqual([])
    expect(result.progress.unlockedStageIds).toEqual([1, 2, 3])
    expect(result.reward.clearedAreaId).toBe('javascript')
    expect(progress.clearedAreaIds).toEqual([])
  })

  it('Boss再クリアではArea CLEARを重複させない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 220,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [1, 2, 3],
      unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
    }
    const result = applyBattleVictory(progress, {
      stageId: 3,
      expReward: 100,
      clearAreaId: 'javascript',
    })

    expect(result.progress.exp).toBe(320)
    expect(result.progress.clearedAreaIds).toEqual(['javascript'])
    expect(result.progress.completedSideQuestIds).toEqual([])
    expect(result.reward.firstClear).toBe(false)
    expect(result.reward.clearedAreaId).toBeUndefined()
  })

  it('TypeScript Boss初回クリアでTypeScript Area CLEARを記録する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 360,
      clearedStageIds: [4, 5],
      unlockedStageIds: [1, 4, 5, 6],
      unlockedSkillIds: ['ts-scan', 'ts-guard', 'ts-label', 'ts-union', 'ts-optional', 'ts-narrow'],
    }
    const result = applyBattleVictory(progress, {
      stageId: 6,
      expReward: 120,
      clearAreaId: 'typescript',
    })

    expect(result.progress.clearedStageIds).toEqual([4, 5, 6])
    expect(result.progress.clearedAreaIds).toEqual(['typescript'])
    expect(result.progress.completedSideQuestIds).toEqual([])
    expect(result.reward.clearedAreaId).toBe('typescript')
  })
})
