export type Enemy = {
  id: string
  name: string
  hp: number
  maxHp: number
  attackName: string
  attackDamage: number
  glyph: string
}

export type TargetRule =
  | { kind: 'firstBelow'; hp: number }
  | { kind: 'allBelow'; hp: number }
  | { kind: 'named'; name: string }
  | { kind: 'lowestHp' }
  | { kind: 'firstAbove'; hp: number }
  | { kind: 'allAbove'; hp: number }

export type SkillCard = {
  id: string
  name: string
  code: string
  power: number
  rule: TargetRule
  concept: string
  explanation: string
}

export type Battle = {
  id: number
  label: string
  title: string
  subtitle: string
  enemies: Enemy[]
  skillIds: string[]
  unlockSkillId?: string
}

const enemy = (
  id: string,
  name: string,
  hp: number,
  attackName: string,
  attackDamage: number,
  glyph: string,
): Enemy => ({ id, name, hp, maxHp: hp, attackName, attackDamage, glyph })

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

export const battles: Battle[] = [
  {
    id: 1,
    label: 'BATTLE 01',
    title: 'First Read',
    subtitle: 'コードが選ぶ「対象」を読む',
    enemies: [
      enemy('slime-a', 'Slime', 34, 'Nibble', 6, '●'),
      enemy('goblin-a', 'Goblin', 72, 'Heavy Slash', 14, '▲'),
    ],
    skillIds: ['trace', 'pulse', 'nova'],
    unlockSkillId: 'viper',
  },
  {
    id: 2,
    label: 'BATTLE 02',
    title: 'One or Many',
    subtitle: 'find と filter の違いを戦況で使い分ける',
    enemies: [
      enemy('slime-b', 'Slime', 42, 'Nibble', 6, '●'),
      enemy('goblin-b', 'Goblin', 68, 'Heavy Slash', 15, '▲'),
      enemy('golem-b', 'Golem', 124, 'Stone Fist', 9, '■'),
    ],
    skillIds: ['trace', 'pulse', 'nova', 'viper'],
    unlockSkillId: 'moon-edge',
  },
  {
    id: 3,
    label: 'BATTLE 03',
    title: 'Priority Queue',
    subtitle: '次の攻撃とコードを読み、倒す順番を決める',
    enemies: [
      enemy('slime-c', 'Slime', 46, 'Bite', 3, '●'),
      enemy('goblin-c', 'Goblin', 84, 'Execution', 8, '▲'),
      enemy('boss-c', 'Boss', 156, 'Meteor', 12, '◆'),
    ],
    skillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
  },
]

export function getTargets(enemies: Enemy[], rule: TargetRule): Enemy[] {
  const alive = enemies.filter((enemy) => enemy.hp > 0)

  switch (rule.kind) {
    case 'firstBelow': {
      const target = alive.find((enemy) => enemy.hp < rule.hp)
      return target ? [target] : []
    }
    case 'allBelow':
      return alive.filter((enemy) => enemy.hp < rule.hp)
    case 'firstAbove': {
      const target = alive.find((enemy) => enemy.hp > rule.hp)
      return target ? [target] : []
    }
    case 'allAbove':
      return alive.filter((enemy) => enemy.hp > rule.hp)
    case 'named': {
      const target = alive.find((enemy) => enemy.name === rule.name)
      return target ? [target] : []
    }
    case 'lowestHp': {
      const target = [...alive].sort((a, b) => a.hp - b.hp)[0]
      return target ? [target] : []
    }
  }
}
