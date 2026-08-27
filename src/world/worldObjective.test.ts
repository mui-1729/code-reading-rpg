import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { getWorldObjective, getWorldProgressChange } from './worldObjective'

describe('World Objective', () => {
  it('初期状態ではJSのIssue #101とTS森のEncounterを案内する', () => {
    const progress = createInitialPlayerProgress()

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      label: 'TARGET SELECTOR INCIDENT',
      clearedBattles: 0,
      status: 'encounter',
      next: '西の草むらでIssue #101を再現',
      bossUnlocked: false,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 0,
      status: 'encounter',
      next: '森でTypeScript Battle',
      bossUnlocked: false,
    })
  })

  it('JS Chapter 1 CLEAR後はQA triageを案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 4, 2],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 1,
      status: 'encounter',
      next: '西の草むらでQA triageを続行',
    })
  })

  it('JS Chapter 2 CLEAR後はSEV-1 Boss対応を案内する', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 2,
      status: 'boss',
      next: '西のBOSSでSEV-1対応',
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

  it('JS Boss CLEAR後はpostmortemを示す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1, 2, 3],
      clearedAreaIds: ['javascript'],
      unlockedStageIds: [1, 4, 2, 3],
    }

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 3,
      status: 'clear',
      next: 'POSTMORTEM · Root cause: implicit array order',
      bossUnlocked: true,
    })
  })

  it('progress差分からIssue進行・SEV-1解放・postmortemを返す', () => {
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
      label: 'TARGET SELECTOR INCIDENT',
      progressLabel: '1 / 3',
      next: '西の草むらでQA triageを続行',
    })
    expect(getWorldProgressChange(afterFirst, afterSecond)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'TARGET SELECTOR INCIDENT',
      progressLabel: '2 / 3',
      next: '西のBOSSでSEV-1対応',
    })
    expect(getWorldProgressChange(afterSecond, afterBoss)).toMatchObject({
      heading: 'WORLD COMPLETE',
      label: 'TARGET SELECTOR INCIDENT',
      progressLabel: '3 / 3',
      next: 'POSTMORTEM · Root cause: implicit array order',
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
