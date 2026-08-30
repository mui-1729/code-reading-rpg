export type LearningSyntax =
  | 'find'
  | 'filter'
  | 'map'
  | 'some'
  | 'every'
  | 'sort'
  | 'reduce'
  | 'hp-property'
  | 'name-property'
  | 'attack-property'
  | 'less-than'
  | 'greater-than'
  | 'strict-equality'
  | 'logical-and'
  | 'logical-or'
  | 'optional-chaining'
  | 'nullish-coalescing'
  | 'type-annotation'
  | 'type-assertion'
  | 'union-type'
  | 'optional-property'
  | 'narrowing'
  | 'type-predicate'
  | 'generic'
  | 'keyof'
  | 'indexed-access'
  | 'function-return-contract'

export type PresentationTransform = 'comparison-parens' | 'arrow-parameter-parens'

export type BattleLearningPolicy = {
  allowedSyntax: readonly LearningSyntax[]
  allowedTransforms: readonly PresentationTransform[]
  requiredSemanticTagsBySkillId?: Readonly<Record<string, readonly string[]>>
}

const PRESENTATION_TRANSFORMS: readonly PresentationTransform[] = [
  'comparison-parens',
  'arrow-parameter-parens',
]

const comparison: readonly LearningSyntax[] = [
  'find',
  'hp-property',
  'less-than',
  'greater-than',
]
const named = [...comparison, 'name-property', 'strict-equality'] as const
const and = [...named, 'logical-and'] as const
const or = [...and, 'logical-or'] as const
const filter = [...or, 'filter'] as const
const map = [...filter, 'map'] as const
const some = [...map, 'some'] as const
const every = [...some, 'every'] as const
const sort = [...every, 'sort'] as const
const safeAccess = [...sort, 'optional-chaining', 'nullish-coalescing'] as const
const javascriptAll = [...safeAccess, 'reduce', 'attack-property'] as const
const typescriptEntry = [
  ...javascriptAll,
  'type-annotation',
  'type-assertion',
] as const
const typescriptConfig = [
  ...typescriptEntry,
  'union-type',
  'optional-property',
  'narrowing',
  'function-return-contract',
] as const
const typescriptAll = [
  ...typescriptConfig,
  'type-predicate',
  'generic',
  'keyof',
  'indexed-access',
] as const

function policy(allowedSyntax: readonly LearningSyntax[]): BattleLearningPolicy {
  return { allowedSyntax, allowedTransforms: PRESENTATION_TRANSFORMS }
}

const policies: Readonly<Record<number, BattleLearningPolicy>> = {
  1: policy(javascriptAll),
  2: policy(javascriptAll),
  3: policy(javascriptAll),
  4: policy(typescriptEntry),
  5: {
    ...policy(typescriptConfig),
    requiredSemanticTagsBySkillId: { 'ts-union': ['type-relevant'] },
  },
  6: {
    ...policy(typescriptAll),
    requiredSemanticTagsBySkillId: { 'ts-union': ['type-relevant'] },
  },
  7: policy(comparison),
  8: policy(named),
  9: policy(named),
  10: policy(and),
  11: policy(or),
  12: policy(or),
  13: policy(or),
  14: policy(filter),
  15: policy(filter),
  16: policy(map),
  17: policy(some),
  18: policy(every),
  19: policy(every),
  20: policy(sort),
  21: policy(safeAccess),
  22: policy(javascriptAll),
}

const fallbackPolicy: BattleLearningPolicy = {
  allowedSyntax: [],
  allowedTransforms: [],
}

export function getBattleLearningPolicy(battleId: number): BattleLearningPolicy {
  return policies[battleId] ?? fallbackPolicy
}

export function isSyntaxAllowed(
  requiredSyntax: readonly LearningSyntax[],
  policyToCheck: BattleLearningPolicy,
): boolean {
  const allowed = new Set(policyToCheck.allowedSyntax)
  return requiredSyntax.every((syntax) => allowed.has(syntax))
}
