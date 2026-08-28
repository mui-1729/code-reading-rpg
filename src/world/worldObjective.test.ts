import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { getWorldObjective, getWorldProgressChange } from './worldObjective'

describe('World Objective', () => {
  it('初期状態ではREAL WORLD incidentに対応するCODE WORLD調査目的を示す', () => {
    const progress = createInitialPlayerProgress()

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      label: 'JAVASCRIPT KINGDOM',
      clearedBattles: 0,
      status: 'encounter',
      next: 'INVESTIGATE // 誤targetの再現地点を確認する',
      bossUnlocked: false,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 0,
      status: 'encounter',
      next: 'INVESTIGATE // API更新後のtargetずれを再現する',
      bossUnlocked: false,
    })
  })

  it('JS Chapter 1 CLEAR後はログから共通処理を調査する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: 'INVESTIGATE // ログから共通処理を特定する',
    })
  })

  it('JS Chapter 2 CLEAR後はCode Coreをroot causeとして案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 2,
      status: 'boss',
      next: 'ROOT CAUSE // 西のCode Coreを確認する',
      bossUnlocked: true,
    })
  })

  it('TS Chapter 1 CLEAR後はoptional / unionの波及経路を追う', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4],
      unlockedStageIds: [1, 4, 5],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: 'INVESTIGATE // optional / unionの波及経路を追う',
      bossUnlocked: false,
    })
  })

  it('TS Chapter 2 CLEAR後はFrontier Compilerをroot causeとして案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4, 5],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 2,
      status: 'boss',
      next: 'ROOT CAUSE // 東のFrontier Compilerを確認する',
      bossUnlocked: true,
    })
    expect(getWorldObjective('javascript', progress).clearedBattles).toBe(0)
  })

  it('JS Boss CLEAR後はincident closeとRETURNを示す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'INCIDENT CLOSED // REAL WORLDへRETURN済み',
      bossUnlocked: true,
    })
  })

  it('TS Boss CLEAR後もincident closeとRETURNを示す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [4, 5, 6],
      clearedAreaIds: ['typescript'],
      unlockedStageIds: [1, 4, 5, 6],
    }

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'INCIDENT CLOSED // REAL WORLDへRETURN済み',
      bossUnlocked: true,
    })
  })

  it('progress差分から調査進行・root cause解放・incident closeを返す', () => {
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
      next: 'INVESTIGATE // ログから共通処理を特定する',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '2 / 3',
      next: 'ROOT CAUSE // 西のCode Coreを確認する',
    })
    expect(getWorldProgressChange(afterSecond, afterBoss)).toMatchObject({
      heading: 'WORLD COMPLETE',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '3 / 3',
      next: 'INCIDENT CLOSED // REAL WORLDへRETURN済み',
    })
  })

  it('TS progress差分もincidentの次調査目的を返す', () => {
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
      next: 'INVESTIGATE // optional / unionの波及経路を追う',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'TYPESCRIPT FRONTIER',
      progressLabel: '2 / 3',
      next: 'ROOT CAUSE // 東のFrontier Compilerを確認する',
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
