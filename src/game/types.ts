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
  | { kind: 'firstAboveAndNamed'; hp: number; name: string }
  | { kind: 'allAbove'; hp: number }
  | { kind: 'allBelowAndAttackAtLeast'; hp: number; attackDamage: number }
  | { kind: 'firstAttackAtLeastOrAbove'; hp: number; attackDamage: number }
  | { kind: 'firstBelowOrAbove'; below: number; above: number }
  | { kind: 'allIfAnyBelow'; hp: number }
  | { kind: 'allIfEveryBelow'; hp: number }
  | { kind: 'highestAttack' }

export type SkillCard = {
  id: string
  name: string
  code: string
  power: number
  rule: TargetRule
  concept: string
  explanation: string
  codeHelpLines?: readonly string[]
}

export type Battle = {
  id: number
  areaId: string
  label: string
  title: string
  subtitle: string
  recommendedLevel: number
  expReward: number
  goldReward: number
  isBoss?: boolean
  enemies: Enemy[]
  skillIds: string[]
  multiLineSkillIds?: string[]
  unlockSkillId?: string
}
