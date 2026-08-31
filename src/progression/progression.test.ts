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

const javascriptRouteBeforeBoss = [
  1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22,
]
const javascriptComplete = [...javascriptRouteBeforeBoss, 3]

describe('player progression', () => {
  it('初期進行はLv1相当で最初のlive incidentとstarter Skillだけを解放する', () => {
    const progress = createInitialPlayerProgress()

    expect(progress).toEqual({
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds: [],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [1],
      unlockedSkillIds: ['trace', 'pulse', 'nova'],
    })
    expect(getPlayerStats(progress.exp)).toEqual({
      level: 1,
      maxHp: 100,
      powerMultiplier: 1,
    })
  })

  it('Level到達に必要な累計EXPを強い成長曲線で計算する', () => {
    expect(getTotalExpForLevel(1)).toBe(0)
    expect(getTotalExpForLevel(2)).toBe(40)
    expect(getTotalExpForLevel(3)).toBe(140)
    expect(getTotalExpForLevel(4)).toBe(330)
    expect(getTotalExpForLevel(5)).toBe(640)
    expect(getTotalExpForLevel(6)).toBe(1100)
    expect(getTotalExpForLevel(7)).toBe(1740)
    expect(getTotalExpForLevel(8)).toBe(2590)
  })

  it('EXP境界でLevelが正しく切り替わる', () => {
    expect(getLevelForExp(0)).toBe(1)
    expect(getLevelForExp(39)).toBe(1)
    expect(getLevelForExp(40)).toBe(2)
    expect(getLevelForExp(139)).toBe(2)
    expect(getLevelForExp(140)).toBe(3)
    expect(getLevelForExp(329)).toBe(3)
    expect(getLevelForExp(330)).toBe(4)
    expect(getLevelForExp(639)).toBe(4)
    expect(getLevelForExp(640)).toBe(5)
    expect(getLevelForExp(1099)).toBe(5)
    expect(getLevelForExp(1100)).toBe(6)
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

  it('最初のlive incident初回クリアでEXP・Gold・Village preparationをまとめて更新する', () => {
    const initial = createInitialPlayerProgress()
    const result = applyBattleVictory(initial, {
      stageId: 1,
      expReward: 12,
      goldReward: 20,
      nextStageId: 7,
    })

    expect(result.progress.exp).toBe(12)
    expect(result.progress.gold).toBe(20)
    expect(result.progress.clearedStageIds).toEqual([1])
    expect(result.progress.unlockedStageIds).toEqual([1, 7])
    expect(result.progress.unlockedSkillIds).toEqual(['trace', 'pulse', 'nova'])
    expect(result.reward.unlockedStageId).toBe(7)
    expect(result.reward.unlockedSkillId).toBeUndefined()
    expect(result.reward.newLevel).toBe(1)
    expect(initial).toEqual(createInitialPlayerProgress())
  })

  it('forged nextStageIdはcanonical prerequisiteを迂回してunlockしない', () => {
    const result = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: 1,
      expReward: 12,
      nextStageId: 3,
    })

    expect(result.progress.unlockedStageIds).toEqual([1, 7])
    expect(result.progress.unlockedStageIds).not.toContain(3)
    expect(result.reward.unlockedStageId).toBe(7)
  })

  it('legacy unlockSkillId入力を偽装してもcanonical masteryを迂回しない', () => {
    const result = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: 1,
      expReward: 12,
      unlockSkillId: 'moon-edge',
    })

    expect(result.progress.unlockedSkillIds).toEqual(['trace', 'pulse', 'nova'])
    expect(result.reward.unlockedSkillId).toBeUndefined()
  })

  it('live incident後のVillage Training 7→8→9は低EXP・Gold 0でForest traceへつなぐ', () => {
    const incident = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: 1,
      expReward: 12,
      goldReward: 20,
      nextStageId: 7,
    })

    const hp = applyBattleVictory(incident.progress, {
      stageId: 7,
      expReward: 8,
      goldReward: 0,
      nextStageId: 8,
    })
    expect(hp.progress.exp).toBe(20)
    expect(hp.progress.gold).toBe(20)
    expect(hp.progress.clearedStageIds).toEqual([1, 7])
    expect(hp.progress.unlockedStageIds).toEqual([1, 7, 8])
    expect(hp.reward.unlockedStageId).toBe(8)

    const name = applyBattleVictory(hp.progress, {
      stageId: 8,
      expReward: 8,
      goldReward: 0,
      nextStageId: 9,
    })
    expect(name.progress.exp).toBe(28)
    expect(name.progress.unlockedStageIds).toEqual([1, 7, 8, 9])
    expect(name.reward.unlockedStageId).toBe(9)

    const find = applyBattleVictory(name.progress, {
      stageId: 9,
      expReward: 8,
      goldReward: 0,
      nextStageId: 10,
    })
    expect(find.progress.exp).toBe(36)
    expect(find.progress.gold).toBe(20)
    expect(find.progress.clearedStageIds).toEqual([1, 7, 8, 9])
    expect(find.progress.unlockedStageIds).toEqual([1, 7, 8, 9, 10])
    expect(find.reward.unlockedStageId).toBe(10)
  })

  it('Forest Lessonはcurrent conceptだけMASTEREDにし、filter習得後に派生incident Skillを解放する', () => {
    const initial = {
      ...createInitialPlayerProgress(),
      exp: 36,
      gold: 20,
      clearedStageIds: [1, 7, 8, 9],
      unlockedStageIds: [1, 7, 8, 9, 10],
    }

    const andResult = applyBattleVictory(initial, {
      stageId: 10,
      expReward: 16,
      goldReward: 6,
      nextStageId: 11,
      unlockSkillId: 'link',
    })
    expect(andResult.progress.exp).toBe(52)
    expect(andResult.progress.gold).toBe(26)
    expect(andResult.progress.unlockedStageIds).toEqual([1, 7, 8, 9, 10, 11])
    expect(andResult.progress.unlockedSkillIds).toEqual(
      expect.arrayContaining(['trace', 'pulse', 'nova', 'link']),
    )
    expect(andResult.progress.unlockedSkillIds).not.toContain('lock')
    expect(andResult.reward.unlockedSkillId).toBe('link')

    const orResult = applyBattleVictory(andResult.progress, {
      stageId: 11,
      expReward: 20,
      goldReward: 8,
      nextStageId: 12,
      unlockSkillId: 'fork',
    })
    expect(orResult.progress.exp).toBe(72)
    expect(orResult.progress.gold).toBe(34)
    expect(orResult.progress.unlockedStageIds).toEqual([1, 7, 8, 9, 10, 11, 12])
    expect(orResult.progress.unlockedSkillIds).toEqual(
      expect.arrayContaining(['link', 'fork']),
    )
    expect(orResult.progress.unlockedSkillIds).not.toContain('lock')
    expect(orResult.progress.unlockedSkillIds).not.toContain('alert')
    expect(orResult.reward.unlockedSkillId).toBe('fork')

    const combinedResult = applyBattleVictory(orResult.progress, {
      stageId: 12,
      expReward: 24,
      goldReward: 10,
    })
    expect(combinedResult.progress.exp).toBe(96)
    expect(combinedResult.progress.gold).toBe(44)
    expect(combinedResult.progress.clearedStageIds).toEqual([1, 7, 8, 9, 10, 11, 12])
    expect(combinedResult.progress.unlockedStageIds).toContain(13)

    const guardianResult = applyBattleVictory(combinedResult.progress, {
      stageId: 13,
      expReward: 36,
      goldReward: 18,
    })
    expect(guardianResult.progress.unlockedStageIds).toContain(14)
    expect(guardianResult.progress.unlockedSkillIds).not.toContain('lock')

    const filterResult = applyBattleVictory(guardianResult.progress, {
      stageId: 14,
      expReward: 28,
      goldReward: 12,
    })
    expect(filterResult.progress.unlockedSkillIds).toEqual(
      expect.arrayContaining(['link', 'fork', 'gather', 'viper', 'lock', 'alert']),
    )
    expect(filterResult.reward.unlockedSkillId).toBe('gather')
  })

  it('再クリアはEXPを100%再獲得しGoldだけ50%へ減衰、CLEARやunlockは重複させない', () => {
    const first = applyBattleVictory(createInitialPlayerProgress(), {
      stageId: 1,
      expReward: 12,
      goldReward: 20,
      nextStageId: 7,
    })
    const replay = applyBattleVictory(first.progress, {
      stageId: 1,
      expReward: 12,
      goldReward: 20,
      nextStageId: 7,
    })

    expect(REPLAY_GOLD_MULTIPLIER).toBe(0.5)
    expect(replay.progress.exp).toBe(24)
    expect(replay.progress.gold).toBe(30)
    expect(replay.progress.clearedStageIds).toEqual([1])
    expect(replay.progress.unlockedStageIds).toEqual([1, 7])
    expect(replay.progress.unlockedSkillIds).toEqual(['trace', 'pulse', 'nova'])
    expect(replay.reward.firstClear).toBe(false)
    expect(replay.reward.unlockedStageId).toBeUndefined()
    expect(replay.reward.unlockedSkillId).toBeUndefined()
  })

  it('replay Goldは端数を切り捨て、負のrewardは0へ正規化する', () => {
    expect(getBattleGoldReward(25, true)).toBe(25)
    expect(getBattleGoldReward(25, false)).toBe(12)
    expect(getBattleGoldReward(-10, false)).toBe(0)
  })

  it('JavaScript Boss初回クリアでArea CLEARとTypeScript入口unlockを記録する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 540,
      clearedStageIds: javascriptRouteBeforeBoss,
      unlockedStageIds: [...javascriptRouteBeforeBoss, 3],
    }
    const result = applyBattleVictory(progress, {
      stageId: 3,
      expReward: 100,
      clearAreaId: 'javascript',
    })

    expect(result.progress.exp).toBe(640)
    expect(result.progress.clearedStageIds).toEqual(javascriptComplete)
    expect(result.progress.clearedAreaIds).toEqual(['javascript'])
    expect(result.progress.unlockedStageIds).toContain(4)
    expect(result.reward.newLevel).toBe(5)
    expect(result.reward.clearedAreaId).toBe('javascript')
    expect(progress.clearedAreaIds).toEqual([])
  })

  it('Boss再クリアではArea CLEARを重複させない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 640,
      clearedStageIds: javascriptComplete,
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [...javascriptComplete, 4],
    }
    const result = applyBattleVictory(progress, {
      stageId: 3,
      expReward: 100,
      clearAreaId: 'javascript',
    })

    expect(result.progress.exp).toBe(740)
    expect(result.progress.clearedAreaIds).toEqual(['javascript'])
    expect(result.reward.firstClear).toBe(false)
    expect(result.reward.clearedAreaId).toBeUndefined()
  })

  it('TypeScript Boss初回クリアでTypeScript Area CLEARを記録する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      exp: 760,
      clearedStageIds: [...javascriptComplete, 4, 5],
      unlockedStageIds: [...javascriptComplete, 4, 5, 6],
    }
    const result = applyBattleVictory(progress, {
      stageId: 6,
      expReward: 120,
      clearAreaId: 'typescript',
    })

    expect(result.progress.clearedStageIds).toEqual([...javascriptComplete, 4, 5, 6])
    expect(result.progress.clearedAreaIds).toEqual(['typescript'])
    expect(result.progress.unlockedSkillIds).toEqual(
      expect.arrayContaining(['ts-scan', 'ts-guard', 'ts-label', 'ts-union', 'ts-optional', 'ts-narrow', 'ts-keyof']),
    )
    expect(result.reward.unlockedSkillId).toBe('ts-narrow')
    expect(result.reward.clearedAreaId).toBe('typescript')
  })
})
