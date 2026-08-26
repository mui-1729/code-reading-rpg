import type { SkillCard } from './types'

export type CodeVariant = {
  id: string
  code: string
  lineMode: 'single' | 'multi'
  codeHelpLines?: readonly string[]
}

export type SkillDefinition = Omit<SkillCard, 'code' | 'codeHelpLines'> & {
  codeVariants: readonly CodeVariant[]
}

export const skillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'trace',
    name: 'TRACE',
    power: 34,
    rule: { kind: 'firstBelow', hp: 45 },
    concept: 'find()',
    explanation:
      'find() は条件に一致した最初の1要素を返します。このカードは、現在HPが45未満の敵のうち先頭の1体を対象にします。',
    codeVariants: [
      { id: 'short', code: 'enemies.find(e => e.hp < 45)', lineMode: 'single' },
      { id: 'enemy', code: 'enemies.find(enemy => enemy.hp < 45)', lineMode: 'single' },
      { id: 'target', code: 'enemies.find(target => target.hp < 45)', lineMode: 'single' },
    ],
  },
  {
    id: 'pulse',
    name: 'PULSE',
    power: 48,
    rule: { kind: 'named', name: 'Goblin' },
    concept: 'find() + ===',
    explanation:
      '=== は値と型が等しいかを比較します。find() と組み合わせ、このカードは名前が Goblin の最初の敵1体を対象にします。',
    codeVariants: [
      { id: 'short', code: 'enemies.find(e => e.name === "Goblin")', lineMode: 'single' },
      {
        id: 'enemy',
        code: 'enemies.find(enemy => enemy.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find(target => target.name === "Goblin")',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'nova',
    name: 'NOVA',
    power: 62,
    rule: { kind: 'firstAbove', hp: 60 },
    concept: '比較演算子 >',
    explanation:
      '> は「より大きい」です。このカードはHPが60より大きい敵のうち、最初の1体だけを対象にします。',
    codeVariants: [
      { id: 'short', code: 'enemies.find(e => e.hp > 60)', lineMode: 'single' },
      { id: 'enemy', code: 'enemies.find(enemy => enemy.hp > 60)', lineMode: 'single' },
      { id: 'target', code: 'enemies.find(target => target.hp > 60)', lineMode: 'single' },
    ],
  },
  {
    id: 'viper',
    name: 'VIPER',
    power: 22,
    rule: { kind: 'allBelow', hp: 55 },
    concept: 'filter()',
    explanation:
      'filter() は条件に一致したすべての要素を新しい配列として返します。このカードはHPが55未満の敵全員を対象にします。',
    codeVariants: [
      { id: 'short', code: 'enemies.filter(e => e.hp < 55)', lineMode: 'single' },
      { id: 'enemy', code: 'enemies.filter(enemy => enemy.hp < 55)', lineMode: 'single' },
      { id: 'target', code: 'enemies.filter(target => target.hp < 55)', lineMode: 'single' },
    ],
  },
  {
    id: 'lock',
    name: 'LOCK',
    power: 24,
    rule: { kind: 'allBelowAndAttackAtLeast', hp: 100, attackDamage: 8 },
    concept: '&&',
    explanation:
      '&& は左右の条件が両方trueのときだけtrueになります。このカードは生存中で、HPが100未満かつ攻撃力が8以上の敵全員を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.filter(e => e.hp > 0 && e.hp < 100 && e.attackDamage >= 8)',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.filter(enemy => enemy.hp > 0 && enemy.hp < 100 && enemy.attackDamage >= 8)',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.filter(target => target.hp > 0 && target.hp < 100 && target.attackDamage >= 8)',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'alert',
    name: 'ALERT',
    power: 40,
    rule: { kind: 'firstAttackAtLeastOrAbove', hp: 120, attackDamage: 14 },
    concept: '||',
    explanation:
      '|| は左右のどちらか一方でもtrueならtrueになります。このカードは生存中で、攻撃力が14以上またはHPが120より大きい最初の敵1体を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.find(e => e.hp > 0 && (e.attackDamage >= 14 || e.hp > 120))',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.find(enemy => enemy.hp > 0 && (enemy.attackDamage >= 14 || enemy.hp > 120))',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find(target => target.hp > 0 && (target.attackDamage >= 14 || target.hp > 120))',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'echo',
    name: 'ECHO',
    power: 26,
    rule: { kind: 'allAbove', hp: 65 },
    concept: 'filter() + >',
    explanation:
      'このfilter() はHPが65より大きい敵をすべて取り出します。低HPの敵ではなく、高HPの敵をまとめて削るカードです。',
    codeVariants: [
      { id: 'short', code: 'enemies.filter(e => e.hp > 65)', lineMode: 'single' },
      { id: 'enemy', code: 'enemies.filter(enemy => enemy.hp > 65)', lineMode: 'single' },
      { id: 'target', code: 'enemies.filter(target => target.hp > 65)', lineMode: 'single' },
    ],
  },
  {
    id: 'moon-edge',
    name: 'MOON EDGE',
    power: 72,
    rule: { kind: 'lowestHp' },
    concept: 'filter() + sort() + [0]',
    explanation:
      '生存Enemyをfilter()で残し、sort((a, b) => a.hp - b.hp)でHPの小さい順に並べ、[0]で先頭を取ります。複数行では中間変数を上から追うと対象が分かります。',
    codeVariants: [
      {
        id: 'short',
        code: '[...enemies].sort((a, b) => a.hp - b.hp)[0]',
        lineMode: 'single',
      },
      {
        id: 'left-right',
        code: '[...enemies].sort((left, right) => left.hp - right.hp)[0]',
        lineMode: 'single',
      },
      {
        id: 'first-second',
        code: '[...enemies].sort((first, second) => first.hp - second.hp)[0]',
        lineMode: 'single',
      },
      {
        id: 'alive-ordered-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nconst ordered = [...alive].sort((a, b) => a.hp - b.hp)\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()でHPが0より大きい生存Enemyだけをaliveへ残す。',
          'aliveをコピーして、sort()でHPの小さい順に並べた配列をorderedへ入れる。',
          '[0]でorderedの先頭、つまり現在HPが最も低いEnemyを選ぶ。',
        ],
      },
      {
        id: 'alive-ordered-named',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst ordered = [...alive].sort((left, right) => left.hp - right.hp)\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()で撃破済みを除き、生存Enemyをaliveへ集める。',
          'sort()のleft.hp - right.hpはHP昇順。結果をorderedへ保存する。',
          'ordered[0]は並べ替え後の先頭なので、HPが最も低いEnemyになる。',
        ],
      },
      {
        id: 'nested-safe',
        code: 'const alive = enemies.filter(({ hp }) => hp > 0)\nconst wrapped = alive.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))\nwrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy',
        lineMode: 'multi',
        codeHelpLines: [
          '分割代入でhpを取り出し、生存Enemyだけをaliveへ残す。',
          'map()でEnemyとnestedなstats.hpを持つ一時objectへ変換する。',
          '?.でhpを読み、なければ??でInfinityを使う。HP昇順の先頭から元のenemyを取り出す。',
        ],
      },
    ],
  },
  {
    id: 'sweep',
    name: 'SWEEP',
    power: 18,
    rule: { kind: 'allIfAnyBelow', hp: 50 },
    concept: 'filter() + some() + ? :',
    explanation:
      '生存Enemyをfilter()したあと、some()でHP50未満が1体でもいるかをbooleanで確認し、三項演算子 ? : で生存敵全員か空配列を返します。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.some(e => e.hp > 0 && e.hp < 50) ? enemies.filter(e => e.hp > 0) : []',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.some(enemy => enemy.hp > 0 && enemy.hp < 50) ? enemies.filter(enemy => enemy.hp > 0) : []',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.some(target => target.hp > 0 && target.hp < 50) ? enemies.filter(target => target.hp > 0) : []',
        lineMode: 'single',
      },
      {
        id: 'alive-wounded-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nconst hasWounded = alive.some(e => e.hp < 50)\nhasWounded ? alive : []',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()で生存Enemyだけをaliveへ残す。',
          'some()でaliveの中にHP50未満が1体でもいるか調べ、true / falseをhasWoundedへ入れる。',
          'hasWoundedがtrueならalive全員、falseなら空配列[]を返す。',
        ],
      },
      {
        id: 'alive-wounded-enemy',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst hasWounded = alive.some(enemy => enemy.hp < 50)\nhasWounded ? alive : []',
        lineMode: 'multi',
        codeHelpLines: [
          'まずfilter()で撃破済みEnemyを除いてaliveを作る。',
          'some()は条件に合う要素そのものではなくbooleanを返す。',
          '三項演算子でbooleanに応じてtarget配列を切り替える。',
        ],
      },
      {
        id: 'every-destructured',
        code: 'const alive = enemies.filter(({ hp }) => hp > 0)\nconst allStable = alive.every(({ hp }) => hp >= 50)\nallStable ? [] : alive',
        lineMode: 'multi',
        codeHelpLines: [
          '分割代入でhpを読み、生存Enemyだけをaliveへ残す。',
          'every()でalive全員がHP50以上かを調べる。',
          '全員が50以上なら空配列。1体でも50未満ならalive全員を対象にする。',
        ],
      },
    ],
  },
  {
    id: 'judge',
    name: 'JUDGE',
    power: 52,
    rule: { kind: 'highestAttack' },
    concept: 'filter() + map() + reduce()',
    explanation:
      '生存Enemyをfilter()し、map()でEnemyとscoreを持つobjectへ変換し、reduce()でscore最大の候補を1つに絞ります。最後の.enemyで元のEnemyを取り出します。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.filter(e => e.hp > 0).reduce((best, e) => e.attackDamage > best.attackDamage ? e : best)',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.filter(enemy => enemy.hp > 0).reduce((best, enemy) => enemy.attackDamage > best.attackDamage ? enemy : best)',
        lineMode: 'single',
      },
      {
        id: 'candidate',
        code: 'enemies.filter(candidate => candidate.hp > 0).reduce((best, candidate) => candidate.attackDamage > best.attackDamage ? candidate : best)',
        lineMode: 'single',
      },
      {
        id: 'scored-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nconst scored = alive.map(e => ({ enemy: e, score: e.attackDamage }))\nscored.reduce((best, e) => e.score > best.score ? e : best).enemy',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()で生存Enemyだけをaliveへ残す。',
          'map()で各Enemyを{ enemy, score }のobjectへ変換し、attackDamageをscoreとして持たせる。',
          'reduce()でscoreが最大のobjectを残し、.enemyで元のEnemyを取り出す。',
        ],
      },
      {
        id: 'scored-enemy',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst scored = alive.map(enemy => ({ enemy, score: enemy.attackDamage }))\nscored.reduce((best, candidate) => candidate.score > best.score ? candidate : best).enemy',
        lineMode: 'multi',
        codeHelpLines: [
          '最初にfilter()でalive配列を作る。',
          'map()は要素数を保ったまま、各Enemyをscore付きobjectへ変換する。',
          'reduce()で最もscoreが高い候補を1つにし、最後にenemy propertyを読む。',
        ],
      },
    ],
  },
]

export const skillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  skillDefinitions.map((definition) => [definition.id, definition]),
)
