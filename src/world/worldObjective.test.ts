import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { getWorldObjective, getWorldProgressChange } from './worldObjective'

describe('World Objective', () => {
  it('初期状態ではJS草むらとTS森のEncounterを案内する', () => {
    const progress = createInitialPlayerProgress()

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 0,
      status: 'encounter',
      next: '草むらでJavaScript Battle',
      bossUnlocked: false,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 0,
      status: 'encounter',
      next: '森でTypeScript Battle',
      bossUnlocked: false,
    })
  })

  it('通常Battleを1つCLEARすると次のEncounterを案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: '草むらで次のJavaScript Battle',
    })
  })

  it('2つ目の通常BattleをCLEARするとBossを案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 2,
      status: 'boss',
      next: '西のBOSSへ',
      bossUnlocked: true,
    })
  })

  it('TypeScriptも独立してBossまで進行する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4, 5],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 2,
      status: 'boss',
      next: '東のBOSSへ',
      bossUnlocked: true,
    })
    expect(getWorldObjective('javascript', progress).clearedBattles).toBe(0)
  })

  it('Boss CLEAR後は3/3のAREA CLEARになる', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'AREA CLEAR',
      bossUnlocked: true,
    })
  })

  it('progress差分から通常進行・Boss解放・Completeを判定する', () => {
    const initial = createInitialPlayerProgress()
    const afterFirst = {
      ...initial,
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }
    const afterSecond = {
      ...afterFirst,
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 4, 2, 3],
    }
    const afterBoss = {
      ...afterSecond,
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
    }

    expect(getWorldProgressChange(initial, afterFirst)).toMatchObject({
      heading: 'WORLD PROGRESS',
      progressLabel: '1 / 3',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      progressLabel: '2 / 3',
      next: '西のBOSSへ',
    })
    expect(getWorldProgressChange(afterSecond, afterBoss)).toMatchObject({
      heading: 'WORLD COMPLETE',
      progressLabel: '3 / 3',
    })
  })

  it('replayではWorld progress feedbackを出さない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }

    expect(getWorldProgressChange(progress, { ...progress, exp: 999, gold: 999 })).toBeNull()
  })
})
