import { describe, expect, it } from 'vitest'
import { createVictoryResultSequence } from './resultSequence'

describe('typed victory result handoff', () => {
  const reward = { expGained: 40, goldGained: 20, previousLevel: 1, newLevel: 2, firstClear: true, unlockedStageId: 8, unlockedSkillId: 'trace' }

  it('replayは実際のEXP/Goldに加えて100%/50% policyを明示する', () => {
    expect(createVictoryResultSequence({ expGained: 10, goldGained: 5, previousLevel: 1, newLevel: 1, firstClear: false })).toEqual([
      { id: 'exp', title: '獲得EXP', detail: '+10', tone: 'reward' },
      { id: 'gold', title: '獲得ゴールド', detail: '+5 G', tone: 'reward' },
      { id: 'replay', title: '再クリア · EXP 100% / GOLD 50%', tone: 'clear' },
    ])
  })

  it('Level Upは実際に増えた最大HP / 威力をvisible eventへ含める', () => {
    expect(createVictoryResultSequence(reward).find((item) => item.id === 'level')).toEqual({
      id: 'level',
      title: 'レベルアップ！ · 最大HP +8 · 威力 +2%',
      detail: '1 → 2',
      tone: 'level',
    })
  })

  it('stage unlockはinternal numeric IDではなくplayer-facing codeで表示する', () => {
    expect(createVictoryResultSequence(reward).find((item) => item.id === 'stage')).toMatchObject({
      title: 'ステージクリア',
      detail: 'STAGE JS-03 解放',
    })
  })

  it('Boss unlockは独立したprogress eventを保つ', () => {
    const items = createVictoryResultSequence(reward, {
      worldFeedback: { kind: 'bossUnlocked', region: 'javascript', heading: 'ボス解放', label: 'KINGDOM', progressLabel: '18 / 19', next: '西のBOSSへ' },
    })
    expect(items.at(-1)).toMatchObject({ title: 'ボス解放', tone: 'progress', detail: 'KINGDOM · 18 / 19 · 次 → 西のBOSSへ' })
  })

  it('結果の種類はdomain fieldsで決まり、翻訳された表示名をparseしない', () => {
    const items = createVictoryResultSequence(reward, { unlockedSkillName: '表示名: WORLD COMPLETE' })
    expect(items.map((item) => item.id)).toEqual(['exp', 'gold', 'level', 'stage', 'skill'])
    expect(items.at(-1)).toMatchObject({ title: 'スキル解放', detail: '表示名: WORLD COMPLETE', tone: 'unlock' })
  })

  it('World progressがある場合はStage clearを重複表示しない', () => {
    const items = createVictoryResultSequence(reward, {
      worldFeedback: { kind: 'progress', region: 'javascript', heading: '進行更新', label: 'KINGDOM', progressLabel: '1 / 19' },
    })
    expect(items.some((item) => item.id === 'stage')).toBe(false)
    expect(items.at(-1)).toMatchObject({ id: 'world-progress', tone: 'progress' })
  })

  it('area completionは関連結果をまとめ、equipment IDを保持する', () => {
    const items = createVictoryResultSequence({ ...reward, clearedAreaId: 'javascript' }, {
      clearedAreaTitle: 'KINGDOM',
      worldFeedback: { kind: 'complete', region: 'javascript', heading: '攻略完了', label: 'KINGDOM', progressLabel: '19 / 19' },
      equipment: { id: 'branch-saber', name: 'Branch Saber' },
    })
    expect(items.filter((item) => item.tone === 'clear')).toEqual([
      { id: 'area', title: 'エリアクリア', detail: 'KINGDOM · KINGDOM · 19 / 19', tone: 'clear' },
    ])
    expect(items.at(-1)).toMatchObject({ equipmentId: 'branch-saber' })
  })
})
