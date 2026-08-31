import type { BattleStoryEvent } from './types'

const firstFilterPreBattleEvent: BattleStoryEvent = {
  id: 'js-filter-before',
  label: 'IMPACT RANGE',
  title: '異常の影響を一体だけでなく全部追う',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '守り人の先では、同じ条件に合うEnemyが何体もtraceへ入ってる。最初の一体だけ見ても、incidentの影響範囲が分からない。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '今までのfind()は条件に合う相手を前から探して、最初の一体で止まった。ここで使われているfilter()は最後まで見て、条件に合うものを全部集める。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'TRACEとGATHERはどちらもHPが45未満を見る。違うのは、一体で止まるか全部集めるか。今の盤面から影響範囲を自分で確かめよう。',
    },
  ],
}

const firstFilterPostBattleEvent: BattleStoryEvent = {
  id: 'js-filter-after',
  label: 'IMPACT MAPPED',
  title: '複数targetの経路がDeep Forestへ続く',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'find()なら最初の一体、filter()なら条件に合うもの全部。これでREAL WORLDで広がっていた影響範囲とCODE WORLDのtraceが対応した。',
    },
    {
      speakerId: 'lead-ada',
      speaker: 'LEAD ADA',
      role: 'SENIOR ENGINEER',
      layer: 'remote',
      text: '複数target側の異常ログが、Forestのさらに西へ伸びている。Deep Forest入口で同じ症状をもう一度確認してくれ。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'このまま西へ進もう。次は新しい練習じゃなく、実際のincidentの二つ目の症状を追う。',
    },
  ],
}

const deepForestFilterPreBattleEvent: BattleStoryEvent = {
  id: 'js-deep-filter-before',
  label: 'FOLLOW SHARED TRACE',
  title: '同じfilter()でも条件が変わる',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '二つ目の症状を追ったら、同じfilter()が別の条件でも使われている場所に着いた。処理の名前を覚えるだけじゃ、ここでは足りない。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '前はHPが45未満だったけど、ECHOはHPが65より大きいを見る。< と > の向きを先に確かめよう。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '条件を読んだらenemiesを最後まで見る。どの相手がtraceへ残るかを現在のdataから決めれば、共有経路をさらに奥へ追える。',
    },
  ],
}

const deepForestFilterPostBattleEvent: BattleStoryEvent = {
  id: 'js-deep-filter-after',
  label: 'TRACE DEEPENED',
  title: '条件が違っても処理の流れは追える',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '<でも>でも、filter()は条件を確認して最後まで見て、当てはまるものを全部集める。値が変わってもcodeを読み直せば追える。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'この先では、集めたEnemyをそのまま使わず別の形へ変えて次の処理へ渡している。traceの形が変わる前後を見比べよう。',
    },
  ],
}

export function getJavaScriptFilterStoryEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  if (battleId === 14) {
    return phase === 'pre' ? firstFilterPreBattleEvent : firstFilterPostBattleEvent
  }
  if (battleId === 15) {
    return phase === 'pre' ? deepForestFilterPreBattleEvent : deepForestFilterPostBattleEvent
  }
  return undefined
}
