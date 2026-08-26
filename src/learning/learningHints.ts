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
    codeLines: [
      'const target = enemies.find((enemy) => enemy.hp < 30)',
    ],
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
    codeLines: [
      'const targets = enemies.filter((enemy) => enemy.hp < 30)',
    ],
    notes: [
      'find()と違い、条件に合う要素を全部集める。',
      '0件なら空の配列[]になる。',
    ],
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
    notes: [
      'a.hp - b.hpならHPが小さい順。',
      'b.hp - a.hpならHPが大きい順。',
    ],
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
    notes: [
      '「未満」と「以下」を読み違えない。',
      '===は値が同じかを比較する。',
    ],
  },
]

export const learningHintById = Object.fromEntries(
  learningHints.map((hint) => [hint.id, hint]),
) as Record<string, LearningHint>
