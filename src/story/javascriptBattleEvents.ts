import type { BattleStoryEvent } from './types'

export type { BattleStoryEvent, BattleStoryLine } from './types'

const postBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-after-first-incident',
    label: 'INCIDENT REPRODUCED',
    title: '最初の症状をつかんだ',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '再現できた。技は勝手に外れたんじゃない。表示されたcodeのruleどおりにtargetを選んで、その結果が現実の期待とずれている。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLD側のtraceも一致した。偶発的な戦闘バグではない。targetを決める条件が西のForest側から流れ込んでいる。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '原因はこの草原で止まってない。ここから西へ進んで、条件がどこで組み合わされているか追おう。',
      },
    ],
  },
  2: {
    id: 'js-after-second-incident',
    label: 'SHARED TRACE FOUND',
    title: '二つの症状が同じ流れへつながった',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '二つ目も再現した。今度は複数targetの処理だけど、さっきまでForestで追ってきた経路と同じ先へ流れてる。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLD側でもcall pathが合流した。ただしCode Coreをroot causeと断定するには、Deep Forestの残りの処理を追って入力がどこへ集約されるか確認したい。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '進む方向はこのまま西だ。戻る必要はない。Deep Forestの奥で、二つの症状が一つの原因へ集まるところまで追おう。',
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
        text: 'Code Coreが安定した！ 草原からDeep Forestまで続いていたtarget異常も消えてる。CODE WORLD側のroot causeは修復完了。',
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
        text: '戻ったな。現実側の戦闘システムも正常化した。最初のincidentはcloseだ。初仕事、よく症状から原因まで追えた。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '小さな症状だけ直すのではなく、stateとcodeのつながりからroot causeを読む。その感覚を次の仕事にも持っていこう。',
      },
    ],
  },
  9: {
    id: 'js-training-complete',
    label: 'FIELD CHECK READY',
    title: '実際のincidentを読める準備ができた',
    lines: [
      {
        speakerId: 'trainer-mio',
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'HPやnameの値、比較、find()の「前から最初の一体」まで追えたね。これで最初のincidentに出ていた一行を、自分で読める。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '村を出て西へ進もう。次は練習用じゃない実際のstateで、target異常をその場で再現する。',
      },
    ],
  },
  10: {
    id: 'js-forest-after-and',
    label: 'TRACE ADVANCED',
    title: '二つの条件を通る枝を追えた',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'この枝は&&で二つの条件を両方通った相手だけを先へ送っていた。左と右を分けて読めば、incidentのtraceを一段奥まで追える。',
      },
    ],
  },
  11: {
    id: 'js-forest-after-or',
    label: 'TRACE BRANCH FOUND',
    title: '別の条件でも同じ経路へ入る',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'こっちは||で、どちらか一つでもtrueなら同じ経路へ入る。&&との違いが分かると、どのstateが異常側へ流れるか見分けやすい。',
      },
    ],
  },
  12: {
    id: 'js-forest-after-combined',
    label: 'TRACE CONVERGED',
    title: '複数の条件が一つの経路へ集まった',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'かっこの内側、&&、||を小さく分ければ、長い条件でもどのtargetが先へ進むか追えた。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'traceが森の守り人の向こうへ集まってる。あれは試験じゃなくて、incidentの経路そのものを塞いでいるみたいだ。',
      },
    ],
  },
}

const preBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-before-first-incident',
    label: 'LIVE INCIDENT',
    title: '最初のtarget異常を再現する',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ここからは訓練用じゃない。Openingで見た「技が違う相手へ飛ぶ」症状が、今のBattle stateに出ている。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'でも読む材料は村で触ったものだけだ。enemyの値、比較、enemiesの並び、find()を順番に追えば、codeが実際に誰を選ぶか判断できる。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'まず症状を正確に再現してくれ。期待していたtargetではなく、codeが現在のstateから何を選ぶかを見るんだ。',
      },
    ],
  },
  2: {
    id: 'js-before-second-incident',
    label: 'SECOND SYMPTOM',
    title: '異常が複数targetへ広がっている',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Deep Forestへ入った途端、同じincidentの別症状が出た。今度は一体だけじゃなく、複数のtargetをまとめて選ぶ処理までずれている。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Forestで見たfilter()、&&、||までがここに出ている。まず条件を小さく読み、どのEnemyが結果へ残るかを追おう。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '一つ目と同じcall pathへ入るか確認したい。答えを当てるのではなく、現在のdataから処理結果を確定してくれ。',
      },
    ],
  },
  3: {
    id: 'js-before-final',
    label: 'ROOT CAUSE',
    title: 'Code Coreへ',
    lines: [
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'Deep ForestのtraceがREAL WORLD側のcall pathと完全に重なった。この先のCode Coreが、二つの症状へ同じ壊れたruleを流している。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '最深部の西口がCoreの手前へ直接つながっていた。ここまで追ってきた経路の続きだ。戻って別の場所を探す必要はない。',
      },
      {
        speakerId: 'lead-ada',

        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '今まで読んだcodeとstateを全部使ってroot causeを止める。準備ができたら行け、Code Knight。',
      },
    ],
  },
  7: {
    id: 'js-village-training-comparison',
    label: 'INCIDENT PREP',
    title: 'まず、ログの数字を一つ読む',
    lines: [
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'BYTEからincidentのログを見せてもらったよ。最初にtargetを絞るところで enemy.hp という数字を使ってる。まずそこだけ読めるようにしよう。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`<` は左の数字が右より小さいか、`>` は左の数字が右より大きいかを見る記号。長いcodeを見る前に、この小さな比較を確定できればいい。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '技の行にはfind()も見えるけど、今は中の「HPをどう比べているか」に注目しよう。どの敵が条件に合うかは、画面のHPで自分で確かめてみて。',
      },
    ],
  },
  8: {
    id: 'js-village-training-equality',
    label: 'INCIDENT PREP',
    title: 'ログにある名前の条件も読む',
    lines: [
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '同じincidentの別の行には enemy.name もある。hpが数字を読むのと同じで、nameはその敵の名前という値を読む。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '`===` は左右が同じ値かを確かめる。codeの右側に書かれた名前と、今いる敵のnameを一体ずつ見比べれば読めるよ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'さっきのHP比較も消えない。知っている条件から一つずつ読めば、実際のincidentでも迷いにくい。',
      },
    ],
  },
  9: {
    id: 'js-village-training-find',
    label: 'INCIDENT PREP',
    title: '実際のselectorがどこで止まるか追う',
    lines: [
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'incidentのtarget selectorはenemiesという集まりを前から見ている。画面の敵を順番に並べたものだと思えばいい。',
      },
      {
        speakerId: 'trainer-mio',

        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'find()はその集まりを前から調べて、カッコの中の条件に最初に合った一体で止まる。条件に合う敵が二体いても、選ばれるのは先に見つかった方だ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '読む順番は「条件を読む → enemiesを前から見る → 最初のtrueで止まる」。ここまで読めれば、次は実際の症状を再現できる。',
      },
    ],
  },
  10: {
    id: 'js-forest-and',
    label: 'FOLLOW THE TRACE',
    title: '二つの条件を通る経路を追う',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '最初の症状から伸びたtraceが、Forestで二つの条件に分かれてる。まず`&&`の左と右を別々に見よう。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '`&&`は「左もtrue、右もtrue」のときだけ全体がtrueになる。日本語なら「A かつ B」に近い。両方通るstateだけが先へ進む。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '使っているのはもう知っているhp、name、===、find()だ。traceがどのEnemyから続くかを、今のdataで確かめよう。',
      },
    ],
  },
  11: {
    id: 'js-forest-or',
    label: 'FOLLOW THE TRACE',
    title: '別の入口からも同じ異常へ入る',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '今度の枝は`||`だ。さっきの&&と違って、二つの条件のどちらかを通れば同じ処理へ入る。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '`||`は左右のどちらか一方でもtrueなら全体がtrueになる。かっこがあったら、その内側の小さな条件から決めよう。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'どのEnemyがこの枝へ入るか分かれば、incidentがどのstateまで広がっているか見えてくる。',
      },
    ],
  },
  12: {
    id: 'js-forest-combined',
    label: 'TRACE JUNCTION',
    title: '条件が合流する場所を読み切る',
    lines: [
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ここでは新しい記号は増えない。&&と||、比較、find()が一つのjunctionに集まってるだけだ。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '長く見えたら、かっこの中 → その外 → find()で前から、の順に小さく分ける。codeを一行丸ごと暗記する必要はない。',
      },
      {
        speakerId: 'byte',

        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'この先の守り人の向こうへtraceが集中してる。まず現在のstateでjunctionの出力を確定しよう。',
      },
    ],
  },
}

export const getJavaScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getJavaScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]
