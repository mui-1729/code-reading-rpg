import type { BattleStoryEvent } from './types'

type StoryPhase = 'pre' | 'post'

const events: Record<number, { pre: BattleStoryEvent; post: BattleStoryEvent }> = {
  16: {
    pre: {
      id: 'js-map-before',
      label: 'DEEP FOREST LESSON 02',
      title: '一つずつ、別の形へ変える',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '次は「集める」ではなく、配列の中身を一つずつ別の形へ変える。map()は元の順番を保ったまま、新しい配列を作る処理だよ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'PROJECTでは各Enemyを { enemy, hp } という小さなobjectへ包む。そのあとに出てくるfind()はもう知っている処理だから、まずmap()の右側だけを追ってみよう。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '変換後のentry.hpを前から確認し、最後の.enemyで元のEnemyへ戻る。どの相手になるかは今の並びから自分で確かめてね。',
        },
      ],
    },
    post: {
      id: 'js-map-after',
      label: 'MAP LEARNED',
      title: '同じ数だけ、新しい形を作る',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'map()は「条件に合うものだけ残す」filter()とは違って、各要素を一つずつ変換する。元が3要素なら、基本的に変換後も3要素だ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '次は、配列から要素そのものを返さず、「一つでも条件に合うか」をtrue / falseで答える処理を読む。',
        },
      ],
    },
  },
  17: {
    pre: {
      id: 'js-some-before',
      label: 'DEEP FOREST LESSON 03',
      title: '一つでもあるかだけを確かめる',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()は条件に合ったEnemyを返す処理じゃない。「一つでもある？」に対してtrueかfalseだけを返す。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'SIGNALでは内側のsome()を先に読む。生存Enemyの中にHP50未満が一体でもいればtrue、いなければfalseだ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'そのbooleanを外側のfilter()が使っている。まずsome()の答えだけ決めてから、filter()へ戻ると読みやすい。',
        },
      ],
    },
    post: {
      id: 'js-some-after',
      label: 'SOME LEARNED',
      title: '結果はtrueかfalse',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()は一体でも条件を満たした時点でtrueになる。必要なのは「誰か」ではなく、「いるかどうか」なんだ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '似た処理にevery()がある。今度は「一体でも」ではなく「全員が」条件を満たすかを確かめる。',
        },
      ],
    },
  },
  18: {
    pre: {
      id: 'js-every-before',
      label: 'DEEP FOREST LESSON 04',
      title: '全員が当てはまるかを確かめる',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'every()も返すのはtrue / false。ただしtrueになるのは、調べた要素が全部条件を満たしたときだけ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'SYNCではまず生存Enemyだけをfilter()し、その全員がHP100未満かをevery()で確認する。some()との違いは「一体でも」か「全員」かだ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '今回も内側のevery()からtrue / falseを決め、そのあと外側のfilter()へ戻ろう。今の盤面の答え自体は自分で読んでみて。',
        },
      ],
    },
    post: {
      id: 'js-every-after',
      label: 'EVERY LEARNED',
      title: 'some()とevery()を分けて読める',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'some()は一つでもtrueならtrue。every()は全部trueのときだけtrue。この二つは返す値がbooleanだと分かれば整理しやすい。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '森の奥にもう一体、大きな守り人がいる。そこでは新しいsyntaxを増やさず、filter() / map() / some() / every()だけで突破しよう。',
        },
      ],
    },
  },
  19: {
    pre: {
      id: 'js-deep-midboss-before',
      label: 'DEEP FOREST MID-BOSS',
      title: '新しい記号なしで読み切る',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'Root Guardianだ。でも新しいsyntaxはない。filter()は集める、map()は変える、some() / every()はtrue / falseを返す。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '長く見えたら、内側の処理から一つずつ結果を作ろう。今までの読み方だけで十分戦える。',
        },
      ],
    },
    post: {
      id: 'js-deep-midboss-after',
      label: 'DEEPEST PATH OPEN',
      title: '森の最深部へ',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '第二の守り人を越えた。ここから先は、新しい処理を一つずつ足しながら、複数行のcodeを途中結果へ分けて読む。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'まずは配列を並べ替えるsort()。並べ替えたあと、先頭の一つをどう取るかを見よう。',
        },
      ],
    },
  },
  20: {
    pre: {
      id: 'js-sort-before',
      label: 'DEEPEST LESSON 01',
      title: '並べ替えてから先頭を見る',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'sort()は配列の順番を並べ替える。ORDERではa.hp - b.hpを使うので、HPが小さいものほど前へ来る。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '複数行を一気に見なくていい。1行目でalive、2行目でorderedを作り、最後の[0]でorderedの先頭を取る。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '途中の配列はCODE DATAでも確認できる。どのEnemyが先頭になるかは、現在HPから自分で追おう。',
        },
      ],
    },
    post: {
      id: 'js-sort-after',
      label: 'SORT LEARNED',
      title: '途中結果へ分ければ長いcodeも読める',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'alive → ordered → ordered[0]。変数ごとに現在値を置けば、複数行でも一行ずつ追える。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '次は「値がないかもしれない」ときに安全に読むための?.と??を足す。sort()自体の読み方は同じだ。',
        },
      ],
    },
  },
  21: {
    pre: {
      id: 'js-safe-before',
      label: 'DEEPEST LESSON 02',
      title: '値がなくても途中で壊さない',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '?.は左側がnullやundefinedなら、その先を無理に読まずundefinedで止まる。これをoptional chainingと呼ぶ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '??は左側がnullかundefinedのときだけ右側の値を使う。SAFE PATHではhpを読めなければInfinityとして扱う。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '新しいのは安全に値を読む部分だけ。aliveを作ってsort()し、[0]を取る大きな流れはBattle 20と同じだ。',
        },
      ],
    },
    post: {
      id: 'js-safe-after',
      label: 'SAFE READ LEARNED',
      title: '?.と??を一組で読める',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '?.で安全に止まり、??で必要なら代わりの値を使う。この二段階を見つければ、防御的なcodeも怖くない。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '最深部の最後はreduce()。配列の要素を一体ずつ比べ、途中結果を一つへまとめていく。',
        },
      ],
    },
  },
  22: {
    pre: {
      id: 'js-reduce-before',
      label: 'DEEPEST LESSON 03',
      title: '途中結果を一つへまとめる',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'reduce()は配列を左から順に見ながら、途中結果を一つだけ持って進む。REDUCE FOCUSではその途中結果がbestだ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'bestと次のenemyのattackDamageを比べ、? : で大きい方を次のbestとして残す。? : は条件がtrueなら左、falseなら右を返す小さな分岐だよ。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '一体ずつ比較して最後まで進んだとき、bestに何が残るかを追おう。現在盤面の答えは自分で決めてね。',
        },
      ],
    },
    post: {
      id: 'js-reduce-after',
      label: 'DEEP FOREST COMPLETE',
      title: 'JavaScriptの基礎を一通り読み切った',
      lines: [
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'comparison、find()、&& / ||、filter()、map()、some() / every()、sort()、?. / ??、reduce()。森で必要な読み方は揃った。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: 'でも最初に起きていた「技が違う相手へ飛ぶ異変」はまだ残っている。Forest東端から草原へ戻り、OverworldのEncounterで実際の異変を二戦追おう。',
        },
        {
          speaker: 'BYTE',
          role: 'DEBUGGER',
          layer: 'code-world',
          text: '二つの異変を確認できたら、北西のCode Coreへ向かう。そこがJavaScript地方のFinal Bossだ。',
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
