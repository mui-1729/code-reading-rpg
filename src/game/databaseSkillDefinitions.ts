import type { SkillDefinition } from './skillDefinitions'

export const databaseSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'query-focus',
    name: 'QUERY FOCUS',
    power: 54,
    rule: { kind: 'highestAttack' },
    concept: 'SELECT / WHERE / ORDER BY / LIMIT',
    explanation:
      'WHEREで生存rowだけを残し、ORDER BY attackDamage DESCで攻撃力の大きい順に並べ、LIMIT 1で先頭の1行を結果にします。',
    codeVariants: [
      {
        id: 'archive-priority',
        lineMode: 'multi',
        code: 'SELECT name, hp, attackDamage\nFROM enemies\nWHERE hp > 0\nORDER BY attackDamage DESC\nLIMIT 1;',
        codeHelpLines: [
          'SELECTは結果として読む列を指定する。ここではname / hp / attackDamageを見る。',
          'FROM enemiesで、CODE DATAにあるEnemy rowを対象にする。',
          'WHERE hp > 0で、HPが0より大きい生存rowだけを残す。',
          'ORDER BY attackDamage DESCで、attackDamageが大きい順に並べる。DESCは大きい方が先。',
          'LIMIT 1で、並べた結果の先頭1行だけを使う。',
        ],
      },
    ],
  },
  {
    id: 'query-lowest-hp',
    name: 'QUERY LOW',
    power: 48,
    rule: { kind: 'lowestHp' },
    concept: 'WHERE / ORDER BY / LIMIT',
    explanation:
      'WHEREで生存rowだけを残し、ORDER BY hp ASCでHPの小さい順に並べ、LIMIT 1で先頭の1行を対象にします。',
    codeVariants: [
      {
        id: 'archive-low-hp',
        lineMode: 'multi',
        code: 'SELECT name, hp\nFROM enemies\nWHERE hp > 0\nORDER BY hp ASC\nLIMIT 1;',
        codeHelpLines: [
          'WHERE hp > 0で倒れていないrowだけを残す。',
          'ORDER BY hp ASCはHPの小さい順。ASCは小さい方が先。',
          'LIMIT 1で先頭の1行だけを結果にする。',
        ],
      },
    ],
  },
]
