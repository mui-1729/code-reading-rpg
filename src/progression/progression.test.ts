import { describe, expect, it } from 'vitest'
import {
  addExp,
  createInitialPlayerProgress,
  getLevelForExp,
  getMaxHpForLevel,
  getPlayerStats,
  getPowerMultiplierForLevel,
  getTotalExpForLevel,
} from './progression'

describe('player progression', () => {
  it('初期進行はLv1相当でStage 1と初期Skillだけを解放する', () => {
    const progress = createInitialPlayerProgress()

    expect(progress).toEqual({
      exp: 0,
      clearedStageIds: [],
      unlockedStageIds: [1],
      unlockedSkillIds: ['trace', 'pulse', 'nova'],
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

  it('EXP追加は元の進行データを変更しない', () => {
    const progress = createInitialPlayerProgress()
    const next = addExp(progress, 40)

    expect(next.exp).toBe(40)
    expect(getPlayerStats(next.exp).level).toBe(2)
    expect(progress.exp).toBe(0)
  })

  it('負のEXPやLevelを安全な最小値へ正規化する', () => {
    expect(getLevelForExp(-100)).toBe(1)
    expect(getTotalExpForLevel(-3)).toBe(0)
    expect(getMaxHpForLevel(0)).toBe(100)
    expect(getPowerMultiplierForLevel(0)).toBe(1)
  })
})
