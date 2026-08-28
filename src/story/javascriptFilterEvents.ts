import type { BattleStoryEvent } from './types'

const firstFilterPreBattleEvent: BattleStoryEvent = {
  id: 'js-filter-before',
  label: 'FOREST LESSON 04',
  title: '最初の一体ではなく、全部を見る',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '今までのfind()は、条件に合う相手を前から探して、最初の一体を見つけたところで止まっていたよね。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '今度のfilter()は途中で止まらない。enemiesを最後まで見て、条件に合った相手を全部集める。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'TRACEとGATHERはどちらも「HPが45未満」を見ている。違うのは、find()が一体で止まるか、filter()が全部集めるかだけだ。今の敵のHPと並びは自分で確かめよう。',
    },
  ],
}

const firstFilterPostBattleEvent: BattleStoryEvent = {
  id: 'js-filter-after',
  label: 'FILTER LEARNED',
  title: '条件に合うものを全部集める',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '読めたね。find()は最初に見つけた一つ、filter()は条件に合ったもの全部。この違いが分かれば、同じ条件でも結果の形を追える。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'ここから先は、集めたものを別の形に変えたり、「一つでもあるか」を確かめたりする読み方につながっていく。まずはfilter()を何度か使って慣れよう。',
    },
  ],
}

const deepForestFilterPreBattleEvent: BattleStoryEvent = {
  id: 'js-deep-filter-before',
  label: 'DEEP FOREST LESSON 01',
  title: '条件の向きが変わっても、全部を見る',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'Deep Forestでもfilter()の動きは同じ。条件に合う相手を一体見つけても止まらず、最後まで見て全部集める。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '前は「HPが45未満」だったけど、ECHOは「HPが65より大きい」を見る。< と > の向きだけを先に確かめよう。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '条件を読んだら、enemiesを最初から最後まで見る。何体当てはまるかと、どの相手かは今の盤面から自分で決めてね。',
    },
  ],
}

const deepForestFilterPostBattleEvent: BattleStoryEvent = {
  id: 'js-deep-filter-after',
  label: 'DEEP FOREST ROUTE OPEN',
  title: 'filter()は条件が変わっても同じ',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'できたね。<でも>でも、filter()は「条件を確認して、最後まで見て、当てはまるものを全部集める」。読む順番は変わらない。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'この先は、集めたEnemyを別の形へ変える処理や、「一体でもいるか」「全員そうか」を確かめる処理が待っていそうだ。',
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
