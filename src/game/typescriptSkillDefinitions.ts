import type { SkillDefinition } from './skillDefinitions'

export const typescriptSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'ts-scan',
    name: 'TYPE SCAN',
    power: 38,
    rule: { kind: 'firstBelow', hp: 55 },
    concept: 'parameter type + return type',
    explanation:
      'TypeScriptでは引数や戻り値へ型注釈を書けます。(enemy: Enemy): boolean はEnemyを受け取りbooleanを返すcallbackです。実際の対象条件はHP55未満の最初のEnemyです。',
    codeVariants: [
      {
        id: 'enemy',
        code: 'enemies.find((enemy: Enemy): boolean => enemy.hp < 55)',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find((target: Enemy): boolean => target.hp < 55)',
        lineMode: 'single',
      },
      {
        id: 'unit',
        code: 'enemies.find((unit: Enemy): boolean => unit.hp < 55)',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'ts-guard',
    name: 'TYPE GUARD',
    power: 24,
    rule: { kind: 'allAbove', hp: 65 },
    concept: 'Enemy[] + boolean',
    explanation:
      'Enemy[]はEnemyの配列を表します。filter()のcallbackがbooleanを返し、HP65より大きいEnemyだけを配列へ残します。',
    codeVariants: [
      {
        id: 'enemy',
        code: '(enemies as Enemy[]).filter((enemy: Enemy): boolean => enemy.hp > 65)',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: '(enemies as Enemy[]).filter((target: Enemy): boolean => target.hp > 65)',
        lineMode: 'single',
      },
      {
        id: 'unit',
        code: '(enemies as Enemy[]).filter((unit: Enemy): boolean => unit.hp > 65)',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'ts-label',
    name: 'LITERAL LOCK',
    power: 48,
    rule: { kind: 'named', name: 'Goblin' },
    concept: 'string literal',
    explanation:
      '"Goblin"はstringの値であり、literalとしても読めます。このSkillはEnemy型のnameを比較し、Goblinという名前の最初のEnemyを対象にします。',
    codeVariants: [
      {
        id: 'enemy',
        code: 'enemies.find((enemy: Enemy): boolean => enemy.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find((target: Enemy): boolean => target.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'unit',
        code: 'enemies.find((unit: Enemy): boolean => unit.name === "Goblin")',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'ts-union',
    name: 'UNION CUT',
    power: 28,
    rule: { kind: 'allBelow', hp: 60 },
    concept: 'union type',
    explanation:
      '40 | 60 は40または60だけを許すunion typeです。ここではlimitが60なので、最終的にHP60未満のEnemy全員が対象になります。',
    codeVariants: [
      {
        id: 'single-enemy',
        code: 'enemies.filter((enemy: Enemy) => enemy.hp < 60)',
        lineMode: 'single',
      },
      {
        id: 'single-target',
        code: 'enemies.filter((target: Enemy) => target.hp < 60)',
        lineMode: 'single',
      },
      {
        id: 'limit-enemy',
        code: 'type Limit = 40 | 60\nconst limit: Limit = 60\nenemies.filter((enemy: Enemy) => enemy.hp < limit)',
        lineMode: 'multi',
        codeHelpLines: [
          'Limitは40か60だけを許すunion type。',
          'この実行ではlimitへ60を入れる。',
          'filter()でHPがlimit=60未満のEnemyをすべて残す。',
        ],
      },
      {
        id: 'limit-target',
        code: 'type Limit = 40 | 60\nconst limit: Limit = 60\nenemies.filter((target: Enemy) => target.hp < limit)',
        lineMode: 'multi',
        codeHelpLines: [
          'Limitは2つのnumber literalからなるunion type。',
          'limitの現在値は60。型が候補を制限している。',
          'target.hp < 60を満たすEnemy全員が残る。',
        ],
      },
    ],
  },
  {
    id: 'ts-optional',
    name: 'OPTIONAL TRACE',
    power: 42,
    rule: { kind: 'firstBelow', hp: 75 },
    concept: 'optional property + narrowing',
    explanation:
      'limit?: number は値がない可能性を持つoptional propertyです。undefinedではないことを確認すると、その後はnumberとして安全に比較できます。',
    codeVariants: [
      {
        id: 'single-enemy',
        code: 'enemies.find((enemy: Enemy) => enemy.hp < 75)',
        lineMode: 'single',
      },
      {
        id: 'single-target',
        code: 'enemies.find((target: Enemy) => target.hp < 75)',
        lineMode: 'single',
      },
      {
        id: 'scan-enemy',
        code: 'type Scan = { limit?: number }\nconst scan: Scan = { limit: 75 }\nconst limit = scan.limit\nenemies.find((enemy: Enemy) => limit !== undefined && enemy.hp < limit)',
        lineMode: 'multi',
        codeHelpLines: [
          'Scanのlimitはoptionalなのでnumber | undefinedになる。',
          '今回はlimit: 75を持つScanを作る。',
          'scan.limitを読むと、まだ型上はnumber | undefined。',
          'limit !== undefinedでnarrowingしてからHP75未満の最初のEnemyを探す。',
        ],
      },
      {
        id: 'scan-target',
        code: 'type Scan = { limit?: number }\nconst scan: Scan = { limit: 75 }\nconst limit = scan.limit\nenemies.find((target: Enemy) => limit !== undefined && target.hp < limit)',
        lineMode: 'multi',
        codeHelpLines: [
          '?付きpropertyは存在しない可能性がある。',
          'このobjectではlimitが75として存在する。',
          'limit変数へoptional propertyを取り出す。',
          'undefinedを除外した後だけnumberとして比較し、最初の対象を選ぶ。',
        ],
      },
    ],
  },
  {
    id: 'ts-narrow',
    name: 'NARROW JUDGE',
    power: 54,
    rule: { kind: 'highestAttack' },
    concept: 'type predicate + intersection',
    explanation:
      'score?: numberを持つCandidateから、type predicateでscoreが必ずnumberの候補へnarrowingします。その後reduce()で攻撃力score最大のEnemyを残します。',
    codeVariants: [
      {
        id: 'single',
        code: 'enemies.filter(e => e.hp > 0).reduce((best, e) => e.attackDamage > best.attackDamage ? e : best)',
        lineMode: 'single',
      },
      {
        id: 'single-enemy',
        code: 'enemies.filter(enemy => enemy.hp > 0).reduce((best, enemy) => enemy.attackDamage > best.attackDamage ? enemy : best)',
        lineMode: 'single',
      },
      {
        id: 'candidate-short',
        code: 'type Candidate = { enemy: Enemy; score?: number }\nconst candidates: Candidate[] = enemies.filter(e => e.hp > 0).map(e => ({ enemy: e, score: e.attackDamage }))\nconst ready = candidates.filter((item): item is Candidate & { score: number } => item.score !== undefined)\nready.reduce((best, item) => item.score > best.score ? item : best).enemy',
        lineMode: 'multi',
        codeHelpLines: [
          'Candidateのscoreはoptionalなのでnumber | undefined。',
          '生存Enemyをscore付きCandidateへ変換する。',
          'type predicateでscoreがnumberのCandidateへnarrowingする。',
          'reduce()で最大scoreを残し、最後に元のenemyを取り出す。',
        ],
      },
      {
        id: 'candidate-named',
        code: 'type Candidate = { enemy: Enemy; score?: number }\nconst candidates: Candidate[] = enemies.filter(enemy => enemy.hp > 0).map(enemy => ({ enemy, score: enemy.attackDamage }))\nconst ready = candidates.filter((candidate): candidate is Candidate & { score: number } => candidate.score !== undefined)\nready.reduce((best, candidate) => candidate.score > best.score ? candidate : best).enemy',
        lineMode: 'multi',
        codeHelpLines: [
          'optional scoreを持つobject typeを定義する。',
          '生存EnemyごとにCandidate objectを作る。',
          'candidate is ... がtrueの要素だけ、score必須型として扱える。',
          'numberになったscoreを比較し、最も攻撃力の高いEnemyへ戻す。',
        ],
      },
    ],
  },
  {
    id: 'ts-keyof',
    name: 'KEY INDEX',
    power: 70,
    rule: { kind: 'lowestHp' },
    concept: 'keyof + indexed access',
    explanation:
      'keyof EnemyはEnemyのproperty名のunionです。keyを"hp"へ固定し、enemy[key]というindexed accessでHPを読み、最小HPのEnemyを選びます。',
    codeVariants: [
      {
        id: 'single',
        code: '[...enemies.filter(e => e.hp > 0)].sort((a, b) => a.hp - b.hp)[0]',
        lineMode: 'single',
      },
      {
        id: 'single-enemy',
        code: '[...enemies.filter(enemy => enemy.hp > 0)].sort((left, right) => left.hp - right.hp)[0]',
        lineMode: 'single',
      },
      {
        id: 'key-short',
        code: 'const key = "hp" as const satisfies keyof Enemy\nconst alive: Enemy[] = enemies.filter(e => e.hp > 0)\nconst ordered = [...alive].sort((a, b) => a[key] - b[key])\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'keyを"hp"に固定しつつ、keyof Enemyに含まれるproperty名か確認する。',
          '生存EnemyだけをEnemy[]としてaliveへ残す。',
          'a[key]はa.hpと同じ。HPの小さい順へ並べる。',
          'ordered[0]で最小HPのEnemyを選ぶ。',
        ],
      },
      {
        id: 'key-named',
        code: 'const key = "hp" as const satisfies keyof Enemy\nconst alive: Enemy[] = enemies.filter(enemy => enemy.hp > 0)\nconst ordered = [...alive].sort((left, right) => left[key] - right[key])\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'keyofでEnemyに存在するkeyだけを扱う。現在のkeyは"hp"。',
          '撃破済みを除いてaliveを作る。',
          'indexed accessでleft.hp / right.hpを読み、昇順へsortする。',
          '先頭が現在HPの最も低いEnemyになる。',
        ],
      },
    ],
  },
]

export const typescriptSkillDefinitionById: Record<string, SkillDefinition> = Object.fromEntries(
  typescriptSkillDefinitions.map((definition) => [definition.id, definition]),
)
