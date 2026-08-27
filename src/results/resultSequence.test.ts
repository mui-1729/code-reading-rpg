import { describe, expect, it } from 'vitest'
import { buildResultSequence } from './resultSequence'

describe('buildResultSequence', () => {
  it('EXP / Gold / Level Up / Stage Clearを順番にし、関連する更新はまとめる', () => {
    expect(buildResultSequence([
      { label: 'EXP GAINED', value: '+40' },
      { label: 'GOLD GAINED', value: '+20 G' },
      { label: 'LEVEL', value: '2 → 3' },
      { text: 'LEVEL UP!' },
      { text: 'STAGE CLEAR RECORDED' },
      { text: 'STAGE 2 UNLOCKED' },
      { text: 'SKILL UNLOCKED: FILTER' },
    ])).toEqual([
      { id: 'exp-0', title: 'EXP GAINED', detail: '+40', tone: 'reward' },
      { id: 'gold-1', title: 'GOLD GAINED', detail: '+20 G', tone: 'reward' },
      { id: 'level-2', title: 'LEVEL UP!', detail: '2 → 3', tone: 'level' },
      { id: 'stage-clear-4', title: 'STAGE CLEAR', detail: 'STAGE 2 UNLOCKED', tone: 'clear' },
      { id: 'skill-6', title: 'SKILL UNLOCKED', detail: 'FILTER', tone: 'unlock' },
    ])
  })

  it('Level Upしていない場合はLEVELだけを結果イベントにしない', () => {
    expect(buildResultSequence([
      { label: 'EXP GAINED', value: '+10' },
      { label: 'GOLD GAINED', value: '+5 G' },
      { label: 'LEVEL', value: '1' },
    ])).toHaveLength(2)
  })

  it('World progressがある場合は内部Stage更新を重複表示しない', () => {
    expect(buildResultSequence([
      { text: 'STAGE CLEAR RECORDED' },
      { text: 'STAGE 2 UNLOCKED' },
      { text: 'SKILL UNLOCKED: FILTER' },
      { text: 'WORLD PROGRESS: JAVASCRIPT GRASSLAND · 1 / 3 · NEXT → 草むらで次のJavaScript Battle' },
    ])).toEqual([
      { id: 'skill-2', title: 'SKILL UNLOCKED', detail: 'FILTER', tone: 'unlock' },
      {
        id: 'world-progress-3',
        title: 'WORLD PROGRESS',
        detail: 'JAVASCRIPT GRASSLAND · 1 / 3 · NEXT → 草むらで次のJavaScript Battle',
        tone: 'progress',
      },
    ])
  })

  it('Boss解放を独立したWorld progress eventとして扱う', () => {
    expect(buildResultSequence([
      { text: 'STAGE CLEAR RECORDED' },
      { text: 'STAGE 3 UNLOCKED' },
      { text: 'BOSS UNLOCKED: JAVASCRIPT GRASSLAND · 2 / 3 · NEXT → 西のBOSSへ' },
    ])).toEqual([
      {
        id: 'boss-unlocked-2',
        title: 'BOSS UNLOCKED',
        detail: 'JAVASCRIPT GRASSLAND · 2 / 3 · NEXT → 西のBOSSへ',
        tone: 'progress',
      },
    ])
  })

  it('Area ClearとWorld Completeを1つの関連イベントへまとめる', () => {
    expect(buildResultSequence([
      { text: 'AREA CLEAR: JAVASCRIPT KINGDOM' },
      { text: 'WORLD COMPLETE: JAVASCRIPT GRASSLAND · 3 / 3' },
    ])).toEqual([
      {
        id: 'area-0',
        title: 'AREA CLEAR',
        detail: 'JAVASCRIPT KINGDOM · JAVASCRIPT GRASSLAND · 3 / 3',
        tone: 'clear',
      },
    ])
  })

  it('Equipment rewardをvisual sourceへ接続できる結果イベントとして保持する', () => {
    expect(buildResultSequence([
      { text: 'WORLD COMPLETE: JAVASCRIPT KINGDOM · 3 / 3' },
      { equipmentId: 'branch-saber', equipmentName: 'Branch Saber' },
    ])).toEqual([
      {
        id: 'world-complete-0',
        title: 'WORLD COMPLETE',
        detail: 'JAVASCRIPT KINGDOM · 3 / 3',
        tone: 'clear',
      },
      {
        id: 'equipment-1',
        title: 'EQUIPMENT ACQUIRED',
        detail: 'Branch Saber',
        tone: 'unlock',
        equipmentId: 'branch-saber',
      },
    ])
  })
})
