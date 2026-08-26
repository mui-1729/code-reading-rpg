import type { LearningHint } from './learningHints'

export const typescriptLearningHints: LearningHint[] = [
  {
    id: 'ts-type-annotation',
    concept: 'type annotation',
    title: '値や引数の型を読む',
    summary: '「: number」「: Enemy」のような型注釈は、値がどんな形で扱われるかを示す。',
    codeLines: [
      'const limit: number = 55',
      'const check = (enemy: Enemy): boolean => enemy.hp < limit',
    ],
    notes: [
      '型注釈そのものが実行時のHPを変えるわけではない。',
      'まず型を確認し、その後に実際の条件式を読む。',
    ],
  },
  {
    id: 'ts-function-signature',
    concept: 'parameter / return type',
    title: '関数の入口と出口の型を読む',
    summary: '(enemy: Enemy): boolean は、Enemyを受け取りbooleanを返す関数を表す。',
    codeLines: [
      'const isWeak = (enemy: Enemy): boolean => enemy.hp < 55',
      'enemies.find(isWeak)',
    ],
    notes: [
      'parameter typeは関数へ渡せる値の形、return typeは返す値の形を示す。',
      'Battleの対象を決めるのは型名ではなく、callbackが返すtrue / falseの条件。',
    ],
  },
  {
    id: 'ts-array-type',
    concept: 'array type',
    title: 'Enemy[]を配列として読む',
    summary: 'Enemy[]はEnemyが複数入る配列。配列methodの前後で要素の集合がどう変わるかを追う。',
    codeLines: [
      'const alive: Enemy[] = enemies.filter((enemy: Enemy) => enemy.hp > 0)',
      'alive[0]',
    ],
    notes: [
      'EnemyとEnemy[]は「1体」と「複数」の違いがある。',
      'filter()は条件に合うEnemyを残した新しい配列を返す。',
    ],
  },
  {
    id: 'ts-string-literal',
    concept: 'string literal',
    title: '文字列の具体的な値を読む',
    summary: '"Goblin"のようなliteralは、stringの中でも特定の1値を表す。比較では現在値まで確認する。',
    codeLines: [
      'const name = "Goblin" as const',
      'enemies.find((enemy: Enemy) => enemy.name === name)',
    ],
    notes: [
      'literalの型情報だけでは対象は決まらない。',
      '実行時にはenemy.nameが"Goblin"と一致する最初のEnemyを探している。',
    ],
  },
  {
    id: 'ts-union',
    concept: 'union type',
    title: '候補が複数ある型を読む',
    summary: 'A | B は「AまたはB」を表す。現在どの値が入っているかまで追う。',
    codeLines: ['type Limit = 40 | 60', 'const limit: Limit = 60'],
    notes: [
      'unionの候補全部が同時に使われるわけではない。',
      'Battleでは型の候補と現在値を分けて読む。',
    ],
  },
  {
    id: 'ts-optional',
    concept: 'optional property',
    title: 'ないかもしれないpropertyを読む',
    summary: 'limit?: number の ? は、そのpropertyが存在しない可能性を表す。',
    codeLines: ['type Scan = { limit?: number }', 'const limit = scan.limit'],
    notes: [
      '読む側ではnumber | undefinedとして考える。',
      '値を使う前にundefinedの可能性を処理する必要がある。',
    ],
  },
  {
    id: 'ts-narrowing',
    concept: 'narrowing',
    title: '条件で型の候補を絞る',
    summary: '条件分岐やtype predicateによって、広い型からより具体的な型として扱えるようになる。',
    codeLines: [
      'if (limit !== undefined) {',
      '  // ここではlimitはnumber',
      '}',
    ],
    notes: [
      'narrowing後に何が確定したかを見る。',
      '実行条件と型情報の両方を上から追う。',
    ],
  },
  {
    id: 'ts-keyof',
    concept: 'keyof / indexed access',
    title: 'property名を型として読む',
    summary: 'keyof EnemyはEnemyが持つproperty名のunion。enemy[key]でそのpropertyへアクセスできる。',
    codeLines: [
      'const key = "hp" as const satisfies keyof Enemy',
      'enemy[key] // enemy.hp と同じ',
    ],
    notes: [
      'keyが何を指しているかを先に確定する。',
      'Battleではkey="hp"なのでindexed accessはHP読解になる。',
    ],
  },
  {
    id: 'ts-generic',
    concept: 'generic',
    title: '型をあとから当てはめる箱として読む',
    summary: 'genericの<T>は、同じ構造を複数の型で使えるようにする型parameter。Scored<Enemy>ならTへEnemyを入れて読む。',
    codeLines: [
      'type Scored<T> = { value: T; score?: number }',
      'const item: Scored<Enemy> = { value: enemy, score: enemy.attackDamage }',
    ],
    notes: [
      'Tそのものが実行時の値ではない。',
      'Scored<Enemy>ではvalueの型がEnemyに決まる。',
    ],
  },
  {
    id: 'ts-utility-pick',
    concept: 'Pick<T, K>',
    title: '必要なpropertyだけの型を作る',
    summary: 'Pick<T, K>は、Tの中からKで指定したpropertyだけを持つ新しい型を作るutility type。',
    codeLines: [
      "type HpView = Pick<Enemy, 'hp'>",
      'const readHp = (enemy: HpView): number => enemy.hp',
    ],
    notes: [
      'Pickはobjectそのものを変更せず、型として見せるpropertyを絞る。',
      'Pick<Enemy, "hp">でも実際に読む値はenemy.hp。',
    ],
  },
]

export const typescriptLearningHintById = Object.fromEntries(
  typescriptLearningHints.map((hint) => [hint.id, hint]),
) as Record<string, LearningHint>
