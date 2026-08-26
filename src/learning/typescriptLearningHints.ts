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
]

export const typescriptLearningHintById = Object.fromEntries(
  typescriptLearningHints.map((hint) => [hint.id, hint]),
) as Record<string, LearningHint>
