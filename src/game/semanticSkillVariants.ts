import type { LearningSyntax } from './battleLearningPolicy'
import type { CodeVariant } from './skillDefinitions'
import type { TargetRule } from './types'

export type SemanticSkillVariant = {
  id: string
  rule: TargetRule
  concept: string
  explanation: string
  codeVariants: readonly CodeVariant[]
  requiredSyntax: readonly LearningSyntax[]
  pedagogyTags?: readonly string[]
  requiresInitialTarget?: boolean
}

export const semanticSkillVariantsById: Readonly<
  Partial<Record<string, readonly SemanticSkillVariant[]>>
> = {
  pulse: [
    {
      id: 'named-slime',
      rule: { kind: 'named', name: 'Slime' },
      concept: 'find() + ===',
      explanation:
        '=== は値と型が等しいかを比較します。find() と組み合わせ、このvariantは名前が Slime の最初の敵1体を対象にします。',
      requiredSyntax: ['find', 'name-property', 'strict-equality'],
      requiresInitialTarget: true,
      codeVariants: [
        {
          id: 'slime-short',
          code: 'enemies.find(e => e.name === "Slime")',
          lineMode: 'single',
        },
        {
          id: 'slime-enemy',
          code: 'enemies.find(enemy => enemy.name === "Slime")',
          lineMode: 'single',
        },
        {
          id: 'slime-target',
          code: 'enemies.find(target => target.name === "Slime")',
          lineMode: 'single',
        },
      ],
    },
  ],
  'ts-union': [
    {
      id: 'contract-60',
      rule: { kind: 'allBelow', hp: 60 },
      concept: 'union type + literal return contract',
      explanation:
        'Limit は60または100のunion typeです。readLimitの戻り値型が() => 60と注釈されているため、この実行のlimitは60と確定し、HP60未満のEnemy全員が対象になります。',
      requiredSyntax: [
        'filter',
        'hp-property',
        'less-than',
        'type-annotation',
        'type-assertion',
        'union-type',
        'function-return-contract',
      ],
      pedagogyTags: ['type-relevant'],
      requiresInitialTarget: true,
      codeVariants: [
        {
          id: 'contract-60-enemy',
          code: '(enemies as Enemy[]).filter((enemy: Enemy) => enemy.hp < (getLimit() as 60))',
          lineMode: 'single',
        },
        {
          id: 'contract-60-target',
          code: '(enemies as Enemy[]).filter((target: Enemy) => target.hp < (getLimit() as 60))',
          lineMode: 'single',
        },
        {
          id: 'contract-60-multi-enemy',
          code: 'type Limit = 60 | 100\nconst readLimit: () => 60 = getLimit\nconst limit: Limit = readLimit()\nenemies.filter((enemy: Enemy) => enemy.hp < limit)',
          lineMode: 'multi',
          codeHelpLines: [
            'Limitは60または100だけを許すunion type。',
            'readLimitへ() => 60という戻り値型を注釈する。getLimitがこの型に合わなければTypeScriptはエラーにする。',
            'limitはLimitの候補のうち、現在は60だと型情報から確定できる。',
            'filter()でHPがlimit=60未満のEnemyをすべて残す。',
          ],
        },
        {
          id: 'contract-60-multi-target',
          code: 'type Limit = 60 | 100\nconst readLimit: () => 60 = getLimit\nconst limit: Limit = readLimit()\nenemies.filter((target: Enemy) => target.hp < limit)',
          lineMode: 'multi',
          codeHelpLines: [
            'Limitは2つのnumber literalからなるunion type。',
            'getLimitをreadLimitへ代入できるのは、() => 60という戻り値型に適合するときだけ。',
            'limitへ入る値は型情報から60に絞れる。',
            'target.hp < 60を満たすEnemy全員が残る。',
          ],
        },
      ],
    },
    {
      id: 'contract-100',
      rule: { kind: 'allBelow', hp: 100 },
      concept: 'union type + literal return contract',
      explanation:
        'Limit は60または100のunion typeです。readLimitの戻り値型が() => 100と注釈されているため、この実行のlimitは100と確定し、HP100未満のEnemy全員が対象になります。',
      requiredSyntax: [
        'filter',
        'hp-property',
        'less-than',
        'type-annotation',
        'type-assertion',
        'union-type',
        'function-return-contract',
      ],
      pedagogyTags: ['type-relevant'],
      requiresInitialTarget: true,
      codeVariants: [
        {
          id: 'contract-100-enemy',
          code: '(enemies as Enemy[]).filter((enemy: Enemy) => enemy.hp < (getLimit() as 100))',
          lineMode: 'single',
        },
        {
          id: 'contract-100-target',
          code: '(enemies as Enemy[]).filter((target: Enemy) => target.hp < (getLimit() as 100))',
          lineMode: 'single',
        },
        {
          id: 'contract-100-multi-enemy',
          code: 'type Limit = 60 | 100\nconst readLimit: () => 100 = getLimit\nconst limit: Limit = readLimit()\nenemies.filter((enemy: Enemy) => enemy.hp < limit)',
          lineMode: 'multi',
          codeHelpLines: [
            'Limitは60または100だけを許すunion type。',
            'readLimitへ() => 100という戻り値型を注釈する。getLimitがこの型に合わなければTypeScriptはエラーにする。',
            'limitはLimitの候補のうち、現在は100だと型情報から確定できる。',
            'filter()でHPがlimit=100未満のEnemyをすべて残す。',
          ],
        },
        {
          id: 'contract-100-multi-target',
          code: 'type Limit = 60 | 100\nconst readLimit: () => 100 = getLimit\nconst limit: Limit = readLimit()\nenemies.filter((target: Enemy) => target.hp < limit)',
          lineMode: 'multi',
          codeHelpLines: [
            'Limitは2つのnumber literalからなるunion type。',
            'getLimitをreadLimitへ代入できるのは、() => 100という戻り値型に適合するときだけ。',
            'limitへ入る値は型情報から100に絞れる。',
            'target.hp < 100を満たすEnemy全員が残る。',
          ],
        },
      ],
    },
  ],
}
