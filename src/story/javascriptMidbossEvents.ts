import type { BattleStoryEvent } from './types'

const preBattleEvent: BattleStoryEvent = {
  id: 'js-forest-midboss-before',
  label: 'TRACE BLOCKED',
  title: '異常の経路を守る相手を越える',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'traceがこの守り人の向こうへ全部集まってる。こいつを倒すこと自体が試験なんじゃない。原因へ続く経路を塞がれてるんだ。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '使われているのは今まで見たHP、name、find()、&&、||だけ。長く見えたら条件を小さく分けて、enemiesを前から追おう。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'どの技が誰へ飛ぶかは今のstateとcodeから決める。守り人を越えた先で、traceが何に変わるか確認しよう。',
    },
  ],
}

const postBattleEvent: BattleStoryEvent = {
  id: 'js-forest-midboss-after',
  label: 'TRACE PATH OPEN',
  title: '一体ではなく複数へ広がる痕跡',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '道が開いた。ここからtraceが一体だけじゃなく、条件に合う複数のEnemyへ枝分かれしてる。',
    },
    {
      speakerId: 'lead-ada',
      speaker: 'LEAD ADA',
      role: 'SENIOR ENGINEER',
      layer: 'remote',
      text: 'REAL WORLD側でも影響範囲が広がっている。最初の一件だけ直すのでは足りない。複数targetを作る処理まで追ってくれ。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '今までのfind()は最初の一体で止まった。次の処理は最後まで見て、条件に合うものを全部集めているみたいだ。',
    },
  ],
}

export function getJavaScriptMidbossStoryEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  if (battleId !== 13) return undefined
  return phase === 'pre' ? preBattleEvent : postBattleEvent
}
