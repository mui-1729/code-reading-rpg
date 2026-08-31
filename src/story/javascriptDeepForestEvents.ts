import type { BattleStoryEvent } from './types'

type StoryPhase = 'pre' | 'post'

const events: Record<number, { pre: BattleStoryEvent; post: BattleStoryEvent }> = {
  16: {
    pre: {
      id: 'js-map-before',
      label: 'TRACE TRANSFORMED',
      title: '同じEnemyが別の形で渡されている',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'traceを追うと、Enemyそのものではなく{ enemy, hp }という小さなdataへ包み直して次へ渡している場所に出た。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'map()は配列の各要素を一つずつ別の形へ変えて、新しい配列を作る。元の順番は保たれる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'PROJECTでは変換後のentry.hpをfind()で前から確認し、最後の.enemyで元のEnemyへ戻る。変換前後を対応させて読もう。',
        },
      ],
    },
    post: {
      id: 'js-map-after',
      label: 'TRACE SHAPE RESTORED',
      title: '形が変わっても同じdataを追える',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'filter()が要素を絞るのに対して、map()は各要素を別の形へ変える。traceの見た目が変わっても、元のEnemyとの対応は追える。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'この先のsignalは「誰か」を返さず、危険なstateが一つでもあるかだけをtrue / falseで次へ渡している。',
        },
      ],
    },
  },
  17: {
    pre: {
      id: 'js-some-before',
      label: 'ALARM SIGNAL',
      title: '一体でも危険なstateがあるか調べる',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'このalarmは特定のEnemy名を必要としていない。「条件に合うものが一つでもあるか」だけで次の処理を切り替えてる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()は条件に合ったEnemyそのものではなくtrue / falseを返す。SIGNALでは生存Enemyの中にHP50未満が一体でもいればtrueになる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'まず内側のsome()の結果を決め、そのbooleanを外側のfilter()へ渡す順で追おう。',
        },
      ],
    },
    post: {
      id: 'js-some-after',
      label: 'ALARM TRACE MATCHED',
      title: 'REAL WORLDの警告条件と一致した',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()が見ていたのは「誰か」じゃなく「いるかどうか」。このtrue / falseが異常側の処理を動かしていた。',
        },
        {
          speaker: 'LEAD ADA',
          role: 'SENIOR ENGINEER',
          layer: 'remote',
          text: 'REAL WORLDのmonitorも同じbooleanで切り替わっている。CODE WORLDで追っている経路と本番ログがまた一致した。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '次のbarrierは一体でも、ではなく群れ全体のstateを見ているみたいだ。',
        },
      ],
    },
  },
  18: {
    pre: {
      id: 'js-every-before',
      label: 'GROUP BARRIER',
      title: '全員のstateで開閉するruleを読む',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'このbarrierは一体の状態では動かない。生存Enemyの全員が条件を満たしているかを見ている。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'every()も返すのはtrue / false。ただし全部の要素が条件を満たしたときだけtrueになる。some()の「一つでも」と分けて読もう。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'SYNCでは生存Enemyをfilter()してから、その全員がHP100未満かをevery()で確認する。今の盤面のbooleanは自分で決めよう。',
        },
      ],
    },
    post: {
      id: 'js-every-after',
      label: 'BARRIER OPEN',
      title: '一つでも、と全員を区別できた',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()は一つでもtrueならtrue、every()は全部trueならtrue。群れ全体で動くbarrierのruleを読めた。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'barrierの先でRoot Guardianがtraceのjunctionを押さえてる。新しいsyntaxは見えない。今までのdata flowだけで越えられる。',
        },
      ],
    },
  },
  19: {
    pre: {
      id: 'js-deep-midboss-before',
      label: 'ROOT TRACE BLOCKED',
      title: 'Root Guardianのjunctionを突破する',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'Root Guardianが複数のtraceを一か所で止めてる。ここを越えれば、二つのincidentがどこへ集約されるか見えるはずだ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '新しいsyntaxはない。filter()は集める、map()は変える、some() / every()はbooleanを返す。内側から結果を作ろう。',
        },
      ],
    },
    post: {
      id: 'js-deep-midboss-after',
      label: 'ROOT TRACE OPEN',
      title: '二つのincidentが同じ最深部へ流れた',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'junctionが開いた。草原の一体targetとDeep Forest入口の複数target、両方のtraceがこの先へ続いてる。',
        },
        {
          speaker: 'LEAD ADA',
          role: 'SENIOR ENGINEER',
          layer: 'remote',
          text: 'こちらでも同じmodule群へ収束した。まだCore断定はしない。最深部の選択処理まで読んで最後の接続を確認しよう。',
        },
      ],
    },
  },
  20: {
    pre: {
      id: 'js-sort-before',
      label: 'TARGET PRIORITY',
      title: '候補を並べ替えて先頭を選ぶ',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '最深部では候補を見つけた順に使わず、HPで並べ替えてからtargetを選んでいる。ここで順番が変わる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'sort((a, b) => a.hp - b.hp)ならHPが小さいものほど前へ来る。1行目でliving、2行目でbyHpを作り、最後の[0]を見る。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '途中の配列はCODE DATAでも確認できる。現在HPから並び替え後の先頭を追おう。',
        },
      ],
    },
    post: {
      id: 'js-sort-after',
      label: 'PRIORITY TRACE FOUND',
      title: '途中結果を追えば選択順も読める',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'living → byHp → byHp[0]。変数ごとの現在値を置けば、複数行でもtarget決定まで追えた。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '次のtraceにはstatsが欠けたrecordが混じってる。値がないときに処理がどう進むか確認しよう。',
        },
      ],
    },
  },
  21: {
    pre: {
      id: 'js-safe-before',
      label: 'MISSING DATA TRACE',
      title: '値がないrecordを含む経路を追う',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'REAL WORLDのログにstatsがないrecordが混ざってた。ここで無理にstats.hpまで読むと、経路の意味を取り違える。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '?.は左がnullやundefinedならundefinedで止まり、??は左がnullかundefinedなら代わりの値を使う。SAFE PATHでは?? Infinityになる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'living → wrapped → sort() → 先頭の.enemyという流れは同じ。nestedな値の読み方だけ追加して追おう。',
        },
      ],
    },
    post: {
      id: 'js-safe-after',
      label: 'MISSING DATA EXPLAINED',
      title: '本番ログの欠け方まで一致した',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'stats?.hpで安全に止まり、??で代わりの値を入れる。欠けたrecordがあっても最終targetまで追えた。',
        },
        {
          speaker: 'LEAD ADA',
          role: 'SENIOR ENGINEER',
          layer: 'remote',
          text: 'production logのnull / undefined branchと一致した。残るtraceは一つ。複数候補を最後に一つへ集約する処理だ。',
        },
      ],
    },
  },
  22: {
    pre: {
      id: 'js-reduce-before',
      label: 'FINAL TRACE',
      title: '複数の候補が最後に一つへ集約される',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'ここがDeep Forest最後のtraceだ。複数のEnemyを左から見ながら、途中結果bestを一つだけ持って進んでいる。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'reduce()でbestと次のenemyのattackDamageを比べ、? : で大きい方を次のbestに残す。最後に何が残るかを一体ずつ追おう。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'ここを抜ければ、この集約結果を受け取っている先が見える。現在盤面の答えはcodeから自分で決めよう。',
        },
      ],
    },
    post: {
      id: 'js-reduce-after',
      label: 'ROOT CAUSE LOCATED',
      title: 'traceはCode Coreへ直結していた',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'つながった。草原の最初の症状、Deep Forest入口の二つ目の症状、その後の変換や判定が全部この集約を通ってCode Coreへ入ってる。',
        },
        {
          speaker: 'LEAD ADA',
          role: 'SENIOR ENGINEER',
          layer: 'remote',
          text: 'REAL WORLDのtraceも同じ場所で終端した。Code Coreをroot causeとして確定する。ここまでの調査結果でFinalへ進める。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'Deep Forestの西口がCore手前へ直結してる。このまま西へ抜けよう。今まで来た道を戻る必要はない。',
        },
      ],
    },
  },
}

export function getJavaScriptDeepForestStoryEvent(
  battleId: number,
  phase: StoryPhase,
): BattleStoryEvent | undefined {
  return events[battleId]?.[phase]
}
