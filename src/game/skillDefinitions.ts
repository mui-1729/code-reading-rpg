import type { SkillCard } from './types'

export type CodeVariant = {
  id: string
  code: string
  lineMode: 'single' | 'multi'
}

export type SkillDefinition = Omit<SkillCard, 'code'> & {
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
      '&& は左右の条件が両方trueのときだけtrueになります。このカードはHPが100未満かつ攻撃力が8以上の敵全員を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.filter(e => e.hp < 100 && e.attackDamage >= 8)',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.filter(enemy => enemy.hp < 100 && enemy.attackDamage >= 8)',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.filter(target => target.hp < 100 && target.attackDamage >= 8)',
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
      '|| は左右のどちらか一方でもtrueならtrueになります。このカードは攻撃力が14以上、またはHPが120より大きい最初の敵1体を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.find(e => e.attackDamage >= 14 || e.hp > 120)',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.find(enemy => enemy.attackDamage >= 14 || enemy.hp > 120)',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find(target => target.attackDamage >= 14 || target.hp > 120)',
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
    concept: 'sort()',
    explanation:
      'sort((a, b) => a.hp - b.hp) はHPの小さい順に並べます。[0] を取るため、現在HPが最も低い敵1体が対象です。',
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
        id: 'ordered-short',
        code: 'const ordered = [...enemies].sort((a, b) => a.hp - b.hp)\nordered[0]',
        lineMode: 'multi',
      },
      {
        id: 'ordered-named',
        code: 'const ordered = [...enemies].sort((left, right) => left.hp - right.hp)\nordered[0]',
        lineMode: 'multi',
      },
    ],
  },
  {
    id: 'sweep',
    name: 'SWEEP',
    power: 18,
    rule: { kind: 'allIfAnyBelow', hp: 50 },
    concept: 'some() + ? :',
    explanation:
      'some() は条件に合う要素が1つでもあればtrueを返します。このカードは生存中のHP50未満の敵が1体でもいれば、生存敵全員を対象にします。? : は条件によって返す値を切り替える三項演算子です。',
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
    ],
  },
  {
    id: 'judge',
    name: 'JUDGE',
    power: 52,
    rule: { kind: 'highestAttack' },
    concept: 'reduce() + ? :',
    explanation:
      'reduce() は配列を1つの値へまとめます。このカードでは生存敵を順に比較し、攻撃力が最も高い敵1体を残します。比較結果を選ぶために三項演算子 ? : を使います。',
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
    ],
  },
]

export const skillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  skillDefinitions.map((definition) => [definition.id, definition]),
)
