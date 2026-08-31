import type { BattleStoryEvent } from './types'

const preBattleEvent: BattleStoryEvent = {
  id: 'js-forest-midboss-before',
  label: 'FOREST MID-BOSS',
  title: '今までの読み方だけで進む',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: 'この先を守っている相手は強そう。でも、新しい記号は増えていない。今まで読んだHP、name、find()、&&、||だけだ。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '長く見えたら、比較を一つ読む。&&や||を左右へ分ける。それからenemiesを前から見る。いつもの順番で追えばいい。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '敵のHPと名前と並びは自分で確認してね。どの技が誰へ飛ぶかは、コードから決めよう。',
    },
  ],
}

const postBattleEvent: BattleStoryEvent = {
  id: 'js-forest-midboss-after',
  label: 'FOREST PATH OPEN',
  title: '一体を探す読み方は身についた',
  lines: [
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '突破できた！ 条件を小さく分けて、find()が最初に止まる相手を自分で追えていた。',
    },
    {
      speakerId: 'byte',

      speaker: 'BYTE',
      role: 'DEBUGGER',
      layer: 'code-world',
      text: '森の奥から、今度は「条件に合うものを一体じゃなく、まとめて集める」ような反応が来てる。次はその読み方を確かめよう。',
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
