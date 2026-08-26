export type LearningHint = {
  id: string
  concept: string
  title: string
  summary: string
  codeLines: string[]
  notes: string[]
}

export const learningHints: LearningHint[] = [
  {
    id: 'js-find',
    concept: 'find()',
    title: '最初の1件を探す',
    summary: 'find()は、条件に合う最初の要素を1つ返す。見つからなければundefinedになる。',
    codeLines: ['const target = enemies.find((enemy) => enemy.hp < 30)'],
    notes: [
      '左から順に条件を確かめる。',
      '条件に合う敵が複数いても、返るのは最初の1体だけ。',
    ],
  },
  {
    id: 'js-filter',
    concept: 'filter()',
    title: '条件に合うものを全部集める',
    summary: 'filter()は、条件に合う要素だけを残した新しい配列を返す。',
    codeLines: ['const targets = enemies.filter((enemy) => enemy.hp < 30)'],
    notes: ['find()と違い、条件に合う要素を全部集める。', '0件なら空の配列[]になる。'],
  },
  {
    id: 'js-sort',
    concept: 'sort()',
    title: '並び順を変える',
    summary: 'sort()の比較関数を読むと、どの値を基準にどちら向きへ並べるか分かる。',
    codeLines: [
      'const ordered = enemies.sort((a, b) => a.hp - b.hp)',
      'const target = ordered[0]',
    ],
    notes: ['a.hp - b.hpならHPが小さい順。', 'b.hp - a.hpならHPが大きい順。'],
  },
  {
    id: 'js-comparison',
    concept: '比較演算子',
    title: '条件式の境界を読む',
    summary: '<、<=、>、>=、===の違いで対象が変わる。数字だけでなく境界を確認する。',
    codeLines: [
      'enemy.hp < 30   // 30は含まない',
      'enemy.hp <= 30  // 30も含む',
      "enemy.type === 'slime'",
    ],
    notes: ['「未満」と「以下」を読み違えない。', '===は値が同じかを比較する。'],
  },
  {
    id: 'js-and',
    concept: '&&',
    title: '2つの条件を両方満たす',
    summary: '&&は、左と右の条件が両方trueのときだけ全体がtrueになる。',
    codeLines: ['enemy.hp < 100 && enemy.attackDamage >= 8'],
    notes: [
      '左だけ、右だけでは対象にならない。',
      'filter()の中で使うと、複数条件に合う要素だけ残せる。',
    ],
  },
  {
    id: 'js-or',
    concept: '||',
    title: 'どちらかの条件を満たす',
    summary: '||は、左右の条件のどちらか一方でもtrueなら全体がtrueになる。',
    codeLines: ['enemy.attackDamage >= 14 || enemy.hp > 120'],
    notes: [
      '両方trueでも結果はtrue。',
      'find()と組み合わせると、どちらかの条件を満たす最初の要素を探せる。',
    ],
  },
  {
    id: 'js-some',
    concept: 'some()',
    title: '1つでも条件に合うか確かめる',
    summary: 'some()は、配列の中に条件を満たす要素が1つでもあればtrueを返す。',
    codeLines: [
      'const wounded = enemies.some((enemy) => enemy.hp > 0 && enemy.hp < 50)',
      'const targets = wounded ? enemies.filter((enemy) => enemy.hp > 0) : []',
    ],
    notes: [
      '返るのは要素そのものではなくtrue / false。',
      '? : は条件によって返す値を切り替える三項演算子。',
    ],
  },
  {
    id: 'js-reduce',
    concept: 'reduce()',
    title: '配列を1つの結果へまとめる',
    summary: 'reduce()は、要素を順番に処理して最終的に1つの値へまとめる。',
    codeLines: [
      'const target = alive.reduce((best, enemy) =>',
      '  enemy.attackDamage > best.attackDamage ? enemy : best',
      ')',
    ],
    notes: [
      'bestには「ここまでで残っている候補」が入る。',
      '今回は攻撃力を比べ、より大きい方を次のbestとして残していく。',
    ],
  },
]

export const learningHintById = Object.fromEntries(
  learningHints.map((hint) => [hint.id, hint]),
) as Record<string, LearningHint>
