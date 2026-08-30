import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { getWorldObjective, getWorldProgressChange } from './worldObjective'

const JS_BEFORE_BOSS = [7, 8, 9, 1, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22]
const JS_COMPLETE = [...JS_BEFORE_BOSS, 3]

const withClears = (clearedStageIds: number[], clearedAreaIds: string[] = []) => ({
  ...createInitialPlayerProgress(),
  clearedStageIds,
  clearedAreaIds,
})

describe('World Objective', () => {
  it('初期状態はincident preparationを示しTypeScriptはまだ進めない', () => {
    const progress = createInitialPlayerProgress()

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      label: 'JAVASCRIPT KINGDOM',
      clearedBattles: 0,
      totalBattles: 19,
      status: 'encounter',
      next: 'INCIDENT PREP // Villageで必要な読み方を確認する',
      bossUnlocked: false,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 0,
      totalBattles: 3,
      status: 'encounter',
      next: 'NEXT // Worldを探索する',
      bossUnlocked: false,
    })
  })

  it('Village preparation中は同じincident preparationを案内する', () => {
    const progress = withClears([7])

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 1,
      totalBattles: 19,
      status: 'encounter',
      next: 'INCIDENT PREP // Villageで必要な読み方を確認する',
      bossUnlocked: false,
    })
  })

  it('Village preparation完了後は最初のlive incidentを案内する', () => {
    const progress = withClears([7, 8, 9])

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 3,
      next: 'LIVE INCIDENT // 草原で最初のtarget異常を再現する',
      bossUnlocked: false,
    })
  })

  it('first incident後はForestのtrace investigationを案内する', () => {
    const progress = withClears([7, 8, 9, 1])

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 4,
      next: 'FOLLOW TRACE // Forestでtarget条件の流れを追う',
    })
  })

  it('JavaScript routeをFinal手前まで完了するとCode Coreをroot causeとして案内する', () => {
    const progress = withClears(JS_BEFORE_BOSS)

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 18,
      totalBattles: 19,
      status: 'boss',
      next: 'ROOT CAUSE // Code Coreを確認する',
      bossUnlocked: true,
    })
  })

  it('JavaScript Boss CLEAR後は19戦すべてを完了扱いにしてTypeScriptへつなぐ', () => {
    const progress = withClears(JS_COMPLETE, ['javascript'])

    expect(getWorldObjective('javascript', progress)).toMatchObject({
      clearedBattles: 19,
      totalBattles: 19,
      status: 'clear',
      next: 'INCIDENT CLOSED // TypeScript地方へ進む',
      bossUnlocked: true,
    })
    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 0,
      totalBattles: 3,
      status: 'encounter',
      next: 'INVESTIGATE // API更新後のtargetずれを再現する',
      bossUnlocked: false,
    })
  })

  it('TypeScript Battle 4 CLEAR後はoptional / unionの波及経路を追う', () => {
    const progress = withClears([...JS_COMPLETE, 4], ['javascript'])

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 1,
      totalBattles: 3,
      status: 'encounter',
      next: 'INVESTIGATE // optional / unionの波及経路を追う',
      bossUnlocked: false,
    })
  })

  it('TypeScript Battle 5 CLEAR後はFrontier Compilerをroot causeとして案内する', () => {
    const progress = withClears([...JS_COMPLETE, 4, 5], ['javascript'])

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      label: 'TYPESCRIPT FRONTIER',
      clearedBattles: 2,
      totalBattles: 3,
      status: 'boss',
      next: 'ROOT CAUSE // 東のFrontier Compilerを確認する',
      bossUnlocked: true,
    })
  })

  it('TypeScript Boss CLEAR後はincident closeとRETURNを示す', () => {
    const progress = withClears([...JS_COMPLETE, 4, 5, 6], ['javascript', 'typescript'])

    expect(getWorldObjective('typescript', progress)).toMatchObject({
      clearedBattles: 3,
      totalBattles: 3,
      status: 'clear',
      next: 'INCIDENT CLOSED // REAL WORLDへRETURN済み',
      bossUnlocked: true,
    })
  })

  it('JavaScript progress差分はsemantic story routeに沿って返す', () => {
    const initial = createInitialPlayerProgress()
    const afterTraining = withClears([7])
    const beforeBoss = withClears(JS_BEFORE_BOSS)
    const afterBoss = withClears(JS_COMPLETE, ['javascript'])

    expect(getWorldProgressChange(initial, afterTraining)).toMatchObject({
      heading: 'WORLD PROGRESS',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '1 / 19',
      next: 'INCIDENT PREP // Villageで必要な読み方を確認する',
    })
    expect(getWorldProgressChange(withClears(JS_BEFORE_BOSS.slice(0, -1)), beforeBoss)).toMatchObject({
      heading: 'BOSS UNLOCKED',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '18 / 19',
      next: 'ROOT CAUSE // Code Coreを確認する',
    })
    expect(getWorldProgressChange(beforeBoss, afterBoss)).toMatchObject({
      heading: 'WORLD COMPLETE',
      label: 'JAVASCRIPT KINGDOM',
      progressLabel: '19 / 19',
      next: 'INCIDENT CLOSED // TypeScript地方へ進む',
    })
  })

  it('TypeScript progress差分もJavaScript完了を前提にcanonical graphから返す', () => {
    const initial = withClears(JS_COMPLETE, ['javascript'])
    const afterFirst = withClears([...JS_COMPLETE, 4], ['javascript'])
    const afterSecond = withClears([...JS_COMPLETE, 4, 5], ['javascript'])

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
    const progress = withClears([7])
    expect(getWorldProgressChange(progress, progress)).toBeNull()
  })
})
