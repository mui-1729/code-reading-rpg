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
      { id: 'default', code: 'enemies.find(e => e.hp < 45)', lineMode: 'single' },
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
      { id: 'default', code: 'enemies.find(e => e.name === "Goblin")', lineMode: 'single' },
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
      { id: 'default', code: 'enemies.find(e => e.hp > 60)', lineMode: 'single' },
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
      { id: 'default', code: 'enemies.filter(e => e.hp < 55)', lineMode: 'single' },
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
      { id: 'default', code: 'enemies.filter(e => e.hp > 65)', lineMode: 'single' },
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
        id: 'default',
        code: '[...enemies].sort((a, b) => a.hp - b.hp)[0]',
        lineMode: 'single',
      },
    ],
  },
]

export const skillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  skillDefinitions.map((definition) => [definition.id, definition]),
)
