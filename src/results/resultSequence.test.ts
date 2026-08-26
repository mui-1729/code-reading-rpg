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

  it('Area ClearとQuest更新を独立イベントとして扱う', () => {
    expect(buildResultSequence([
      { text: 'AREA CLEAR: JAVASCRIPT KINGDOM' },
      { text: 'QUEST UPDATED: 王国のコード門を突破せよ · NEXT → ONE OR MANY' },
    ])).toEqual([
      { id: 'area-0', title: 'AREA CLEAR', detail: 'JAVASCRIPT KINGDOM', tone: 'clear' },
      {
        id: 'quest-1',
        title: 'QUEST UPDATED',
        detail: '王国のコード門を突破せよ · NEXT → ONE OR MANY',
        tone: 'quest',
      },
    ])
  })
})
