import type { BattleStoryEvent } from './types'

export type { BattleStoryEvent, BattleStoryLine } from './types'

const postBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-after-chapter-1',
    label: 'AFTER BATTLE',
    title: '直ったはずなのに',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'この地点のtarget異常は止まった！ ……でも待って。同じ形の症状が別の戦闘ログにも残ってる。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLD側でも別機能の異常が続いている。一か所だけのbugじゃなさそうだ。どこまで波及しているか追ってくれ。',
      },
      {
        speakerId: 'byte',

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
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '見つけた。別々の異変に見えていた処理が、全部同じ場所を通ってる。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '現実側のcall pathも一致した。王国中の戦闘処理をまとめるCode Coreがroot cause候補だ。',
      },
      {
        speakerId: 'byte',

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
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Code Coreが安定した！ 草原の異変も全部消えてる。CODE WORLD側のroot causeは修復完了。',
      },
      {
        speakerId: 'system',

        speaker: 'SYSTEM',
        role: 'CONNECTOR',
        layer: 'return',
        text: 'CODE WORLDの状態をREAL WORLDへ同期。sessionを切り離して、エンジニアをRETURNする。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '戻ったな。現実側の戦闘システムも正常化した。最初のincidentはcloseだ。初仕事、よく原因まで追えた。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '小さな症状だけ直すのではなく、コードのつながりからroot causeを読む。その感覚を次の仕事にも持っていこう。',
      },
    ],
  },
  10: {
    id: 'js-forest-after-and',
    label: 'FOREST NOTE',
    title: '「両方」を一つずつ読む',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '&&が出ても、いっぺんに考えなくて大丈夫。左をtrueかfalseか決めて、次に右を見る。それから「両方trueか」を確かめれば読める。',
      },
    ],
  },
  11: {
    id: 'js-forest-after-or',
    label: 'FOREST NOTE',
    title: '「どちらか」を見分ける',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '||は「どちらか一つでもtrueなら通る」。&&の「両方必要」と並べると違いが分かりやすいね。',
      },
    ],
  },
  12: {
    id: 'js-forest-after-combined',
    label: 'FOREST ROUTE OPEN',
    title: '記号が増えても読む順番は同じ',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'かっこの内側を先に読み、&&と||を小さな条件へ分ければ追えた。新しい記号を丸暗記するより、読む順番を守る方が大事だ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'この森では同じruleでも敵のHPや並びが変わる。何度か戦うと、条件を自分で追う感覚を確かめられるよ。',
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
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLDのtraceもここへ集約している。この先のCode Coreがroot causeなら、incident全体を止められる。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ログが一気に増えてる。Core自身が壊れたruleを繰り返して、草原の異変を作ってるみたい。',
      },
      {
        speakerId: 'lead-ada',

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
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '長いコードを全部いっぺんに読む必要はないよ。まず enemy.hp を見よう。点の右にある hp は、その敵が今持っているHPの数字だ。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`<` は左の数字が右より小さいか、`>` は左の数字が右より大きいかを見る記号。まずこの小さな比べ方だけ追えばいい。',
      },
      {
        speakerId: 'byte',

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
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '次は enemy.name。hp が数字を読むのと同じで、name はその敵の名前という値を読む。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`===` は左右が同じ値かを確かめる。コードの右側に書かれた名前と、今いる敵の name を一体ずつ見比べれば読めるよ。',
      },
      {
        speakerId: 'byte',

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
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'enemies は、画面にいる敵たちを順番に並べた集まりだと思えばいい。左から順に一体ずつ見ていける。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'find() はその集まりを前から調べて、カッコの中の条件に最初に合った一体で止まる。条件に合う敵が二体いても、選ばれるのは先に見つかった方だ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '読む順番は「条件を読む → enemies を前から見る → 最初の true で止まる」。答えは言わないから、今の並びとHPで追ってみよう。',
      },
    ],
  },
  10: {
    id: 'js-forest-and',
    label: 'FOREST LESSON',
    title: '二つともtrueなら通る',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '森に入ると、条件が一つ増えたみたい。でも読むやり方は変えなくていい。まず `&&` の左と右を別々に見よう。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '`&&` は「左もtrue、右もtrue」のときだけ全体がtrueになる。日本語なら「A かつ B」に近い。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '今回はもう知っている hp、name、===、find()しか使っていない。敵を前から見て、二つの条件を一体ずつ確かめよう。',
      },
    ],
  },
  11: {
    id: 'js-forest-or',
    label: 'FOREST LESSON',
    title: 'どちらかtrueなら通る',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '次の記号は `||`。見た目は似てるけど、&&とは通り方が違う。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '`||` は左右のどちらか一方でもtrueなら、全体がtrueになる。日本語なら「A または B」に近い。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'かっこがあったら、まずその内側の「HPが40未満 || 80より大きい」を見る。そのあと外側の&&へ戻ればいい。どの敵になるかは今のHPで追ってみよう。',
      },
    ],
  },
  12: {
    id: 'js-forest-combined',
    label: 'FOREST LESSON',
    title: '小さく分ければ読める',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ここでは新しい記号は増えないよ。&&と||、比較、find()が一緒に出るだけ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '長く見えたら、かっこの中 → その外 → find()で前から、の順に小さく分ける。コードを一行丸ごと暗記する必要はない。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'この森を抜ける練習として、敵の並びとHPだけを見て自分で対象を決めてみよう。',
      },
    ],
  },
}

export const getJavaScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getJavaScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]
