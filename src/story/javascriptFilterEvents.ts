import type { BattleStoryEvent } from './types'

const preBattleEvent: BattleStoryEvent = {
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

const postBattleEvent: BattleStoryEvent = {
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

export function getJavaScriptFilterStoryEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  if (battleId !== 14) return undefined
  return phase === 'pre' ? preBattleEvent : postBattleEvent
}
