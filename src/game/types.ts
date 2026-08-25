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
