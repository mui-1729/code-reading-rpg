import type { BattleStoryEvent } from './types'

const filterIntroPreBattleEvent: BattleStoryEvent = {
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

const filterIntroPostBattleEvent: BattleStoryEvent = {
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

const filterRepeatPreBattleEvent: BattleStoryEvent = {
  id: 'js-filter-repeat-before',
  label: 'DEEP FOREST LESSON 01',
  title: '条件が変わっても、全部を見る',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'Deep Forestでもfilter()の動き自体は同じ。enemiesを最後まで見て、条件に合ったものを全部集める。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '前は「45未満」だったけど、今度は「65より大きい」を見る。変わったのは条件の向きで、filter()の意味は変わらない。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'GATHERとECHOのコードを見比べて、まず<と>の向きを確認しよう。どの相手が当てはまるかは、今のHPを自分で読んで決めて。',
    },
  ],
}

const filterRepeatPostBattleEvent: BattleStoryEvent = {
  id: 'js-filter-repeat-after',
  label: 'FILTER REPEATED',
  title: '条件が変わっても同じ順番で読める',
  lines: [
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'filter()は条件そのものではなく、「条件に合うものを全部集める」動きだった。だから<が>に変わっても、読む順番は同じだ。',
    },
    {
      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'これでfilter()は一度きりの形じゃなく、条件を変えても追えるようになった。Deep Forestの次は、集めたものを別の形へ変える読み方へ進めそうだ。',
    },
  ],
}

export function getJavaScriptFilterStoryEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  if (battleId === 14) {
    return phase === 'pre' ? filterIntroPreBattleEvent : filterIntroPostBattleEvent
  }
  if (battleId === 15) {
    return phase === 'pre' ? filterRepeatPreBattleEvent : filterRepeatPostBattleEvent
  }
  return undefined
}
