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
        layer: 'code-world',
        text: 'この地点のtarget異常は止まった！ ……でも待って。同じ形の症状が別の戦闘ログにも残ってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLD側でも別機能の異常が続いている。一か所だけのbugじゃなさそうだ。どこまで波及しているか追ってくれ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '次の症状は草原の奥に出てる。同じincidentをCODE WORLD側から追おう。',
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
        layer: 'code-world',
        text: '見つけた。別々の異変に見えていた処理が、全部同じ場所を通ってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '現実側のcall pathも一致した。王国中の戦闘処理をまとめるCode Coreがroot cause候補だ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Coreの反応が強くなってる。北西の入口から直接入って、世界のruleになっている共通コードを読もう。',
      },
    ],
  },
  3: {
    id: 'js-ending',
    label: 'SYSTEM RESTORED',
    title: 'JavaScript incident、解決',
    lines: [
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Code Coreが安定した！ 草原の異変も全部消えてる。CODE WORLD側のroot causeは修復完了。',
      },
      {
        speaker: 'SYSTEM',
        role: 'CONNECTOR',
        layer: 'return',
        text: 'CODE WORLDの状態をREAL WORLDへ同期。sessionを切り離して、エンジニアをRETURNする。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '戻ったな。現実側の戦闘システムも正常化した。最初のincidentはcloseだ。初仕事、よく原因まで追えた。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '小さな症状だけ直すのではなく、コードのつながりからroot causeを読む。その感覚を次の仕事にも持っていこう。',
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
        layer: 'remote',
        text: 'REAL WORLDのtraceもここへ集約している。この先のCode Coreがroot causeなら、incident全体を止められる。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ログが一気に増えてる。Core自身が壊れたruleを繰り返して、草原の異変を作ってるみたい。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '今まで読んだコードを全部使ってroot causeを確認する。準備ができたら行け、Code Knight。',
      },
    ],
  },
  7: {
    id: 'js-village-training-comparison',
    label: 'VILLAGE TRAINING',
    title: 'まず、数字を一つ読む',
    lines: [
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '長いコードを全部いっぺんに読む必要はないよ。まず enemy.hp を見よう。点の右にある hp は、その敵が今持っているHPの数字だ。',
      },
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`<` は左の数字が右より小さいか、`>` は左の数字が右より大きいかを見る記号。まずこの小さな比べ方だけ追えばいい。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '技の行には find() も見えるけど、今は中の「HPをどう比べているか」に注目しよう。どの敵が条件に合うかは、画面のHPを見て自分で確かめてみて。',
      },
    ],
  },
  8: {
    id: 'js-village-training-equality',
    label: 'VILLAGE TRAINING',
    title: '文字も値として読む',
    lines: [
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '次は enemy.name。hp が数字を読むのと同じで、name はその敵の名前という値を読む。',
      },
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`===` は左右が同じ値かを確かめる。コードの右側に書かれた名前と、今いる敵の name を一体ずつ見比べれば読めるよ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '前に見たHPの比較も一緒に出る。新しいことだけに飛びつかず、知っている部分から順番に読んでみよう。',
      },
    ],
  },
  9: {
    id: 'js-village-training-find',
    label: 'VILLAGE TRAINING',
    title: '前から探して、最初で止まる',
    lines: [
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'enemies は、画面にいる敵たちを順番に並べた集まりだと思えばいい。左から順に一体ずつ見ていける。',
      },
      {
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'find() はその集まりを前から調べて、カッコの中の条件に最初に合った一体で止まる。条件に合う敵が二体いても、選ばれるのは先に見つかった方だ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '読む順番は「条件を読む → enemies を前から見る → 最初の true で止まる」。答えは言わないから、今の並びとHPで追ってみよう。',
      },
    ],
  },
}

export const getJavaScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getJavaScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]
