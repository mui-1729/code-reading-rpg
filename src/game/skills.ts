import type { SkillCard } from './types'

export const skills: Record<string, SkillCard> = {
  trace: {
    id: 'trace',
    name: 'TRACE',
    code: 'enemies.find(e => e.hp < 45)',
    power: 34,
    rule: { kind: 'firstBelow', hp: 45 },
    concept: 'find()',
    explanation:
      'find() は条件に一致した最初の1要素を返します。このカードは、現在HPが45未満の敵のうち先頭の1体を対象にします。',
  },
  pulse: {
    id: 'pulse',
    name: 'PULSE',
    code: 'enemies.find(e => e.name === "Goblin")',
    power: 48,
    rule: { kind: 'named', name: 'Goblin' },
    concept: 'find() + ===',
    explanation:
      '=== は値と型が等しいかを比較します。find() と組み合わせ、このカードは名前が Goblin の最初の敵1体を対象にします。',
  },
  nova: {
    id: 'nova',
    name: 'NOVA',
    code: 'enemies.find(e => e.hp > 60)',
    power: 62,
    rule: { kind: 'firstAbove', hp: 60 },
    concept: '比較演算子 >',
    explanation:
      '> は「より大きい」です。このカードはHPが60より大きい敵のうち、最初の1体だけを対象にします。',
  },
  viper: {
    id: 'viper',
    name: 'VIPER',
    code: 'enemies.filter(e => e.hp < 55)',
    power: 22,
    rule: { kind: 'allBelow', hp: 55 },
    concept: 'filter()',
    explanation:
      'filter() は条件に一致したすべての要素を新しい配列として返します。このカードはHPが55未満の敵全員を対象にします。',
  },
  echo: {
    id: 'echo',
    name: 'ECHO',
    code: 'enemies.filter(e => e.hp > 65)',
    power: 26,
    rule: { kind: 'allAbove', hp: 65 },
    concept: 'filter() + >',
    explanation:
      'このfilter() はHPが65より大きい敵をすべて取り出します。低HPの敵ではなく、高HPの敵をまとめて削るカードです。',
  },
  'moon-edge': {
    id: 'moon-edge',
    name: 'MOON EDGE',
    code: '[...enemies].sort((a, b) => a.hp - b.hp)[0]',
    power: 72,
    rule: { kind: 'lowestHp' },
    concept: 'sort()',
    explanation:
      'sort((a, b) => a.hp - b.hp) はHPの小さい順に並べます。[0] を取るため、現在HPが最も低い敵1体が対象です。',
  },
}
