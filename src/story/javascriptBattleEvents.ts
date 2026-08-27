import type { BattleStoryEvent } from './types'

export type { BattleStoryEvent, BattleStoryLine } from './types'

const postBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-after-chapter-1',
    label: 'AFTER BATTLE',
    title: '直ったはずなのに',
    lines: [
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'ターゲット処理、正常に戻った！ ……でも待って。同じ形のエラーが別のログにも残ってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '一か所だけのバグじゃなさそうだな。BYTEと一緒に、どこまで広がっているか追ってくれ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: '次のログは草原の奥から来てる。行こう、Code Knight。',
      },
    ],
  },
  2: {
    id: 'js-after-chapter-2',
    label: 'NEW CLUE',
    title: '共通コードの先',
    lines: [
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: '見つけた。壊れていた処理、別々に見えて全部同じ場所を通ってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '王国中の戦闘処理をまとめているCode Coreだ。そこが壊れれば、修正しても別の場所でまた異常が出る。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'Coreの反応が強くなってる。次は北西の入口から直接中へ入ろう。',
      },
    ],
  },
  3: {
    id: 'js-ending',
    label: 'SYSTEM RESTORED',
    title: 'JavaScript王国、復旧',
    lines: [
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'Coreの値が安定した！ 草原の戦闘ログも全部正常に戻ってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '最初の小さなバグから、よくここまで原因を追えたな。コードは一行だけじゃなく、つながりを読むのが大事だ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: '初仕事、完了だね。次のシステムでまた変なコードを見つけたら、そのときも一緒に読もう。',
      },
    ],
  },
}

const preBattleEvents: Record<number, BattleStoryEvent> = {
  3: {
    id: 'js-before-final',
    label: 'BEFORE BATTLE',
    title: 'Code Coreへ',
    lines: [
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: 'ここから先がCode Coreだ。王国中の戦闘処理がここを通っている。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'ログが一気に増えてる。Core自身が壊れた処理を繰り返してるみたい。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '今まで読んだコードを全部使って、暴走を止める。準備ができたら行け、Code Knight。',
      },
    ],
  },
}

export const getJavaScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getJavaScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]
