import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { getWorldObjective, getWorldProgressChange } from './worldObjective'

describe('World Objective', () => {
  it('初期状態ではJSの最初のバグとTSのAPI incidentを案内する', () => {
    const progress = createInitialPlayerProgress()

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      label: 'JAVASCRIPT KINGDOM',
      clearedBattles: 0,
      status: 'encounter',
      next: '戦闘システムの最初のバグを直す',
      bossUnlocked: false,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 0,
      status: 'encounter',
      next: 'API更新後の型ずれを調べる',
      bossUnlocked: false,
    })
  })

  it('JS Chapter 1 CLEAR後はログから共通コードを追う', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: 'ログを追って共通コードを探す',
    })
  })

  it('JS Chapter 2 CLEAR後はCode Coreを案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 2,
      status: 'boss',
      next: '西のCode Coreへ向かう',
      bossUnlocked: true,
    })
  })

  it('TS Chapter 1 CLEAR後はoptional / unionのログを追う', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4],
      unlockedStageIds: [1, 4, 5],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: 'optional / unionのログを追う',
      bossUnlocked: false,
    })
  })

  it('TS Chapter 2 CLEAR後はFrontier Compilerを案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4, 5],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 2,
      status: 'boss',
      next: '東のFrontier Compilerへ向かう',
      bossUnlocked: true,
    })
    expect(getWorldObjective('javascript', progress).clearedBattles).toBe(0)
  })

  it('JS Boss CLEAR後はシステム復旧を示す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'SYSTEM RESTORED',
      bossUnlocked: true,
    })
  })

  it('TS Boss CLEAR後はcontract復旧を示す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4, 5, 6],
      clearedAreaIds: ['typescript'],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'CONTRACT RESTORED',
      bossUnlocked: true,
    })
  })

  it('progress差分からbug進行・Code Core解放・復旧を返す', () => {
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
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '1 / 3',
      next: 'ログを追って共通コードを探す',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '2 / 3',
      next: '西のCode Coreへ向かう',
    })
    expect(getWorldProgressChange(afterSecond, afterBoss)).toMatchObject({
      heading: 'WORLD COMPLETE',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '3 / 3',
      next: 'SYSTEM RESTORED',
    })
  })

  it('TS progress差分もincidentの次目的を返す', () => {
    const initial = createInitialPlayerProgress()
    const afterFirst = {
      ...initial,
      clearedStageIds: [4],
      unlockedStageIds: [1, 4, 5],
    }
    const afterSecond = {
      ...afterFirst,
      clearedStageIds: [4, 5],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldProgressChange(initial, afterFirst)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      progressLabel: '1 / 3',
      next: 'optional / unionのログを追う',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'TYPESCRIPT FRONTIER',
      progressLabel: '2 / 3',
      next: '東のFrontier Compilerへ向かう',
    })
  })

  it('replayではWorld progress feedbackを出さない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }
    expect(getWorldProgressChange(progress, progress)).toBeNull()
  })
})
