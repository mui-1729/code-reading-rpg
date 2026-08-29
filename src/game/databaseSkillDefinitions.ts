import type { SkillDefinition } from './skillDefinitions'

export const databaseSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'db-priority-row',
    name: 'QUERY PRIORITY',
    power: 58,
    rule: { kind: 'highestAttack' },
    concept: 'SELECT / WHERE / ORDER BY / LIMIT',
    explanation:
      'SQLは上から「どの列を見るか」「どの行を残すか」「どう並べるか」「何件取るか」に分けて読む。このqueryは生存中のrowだけを残し、attackDamageの大きい順に並べ、先頭1件を対象にする。',
    codeVariants: [
      {
        id: 'priority-desc',
        code: 'SELECT name, attackDamage\nFROM enemies\nWHERE hp > 0\nORDER BY attackDamage DESC\nLIMIT 1;',
        lineMode: 'multi',
        codeHelpLines: [
          'SELECTは結果として見たい列。ここではnameとattackDamageを見る。',
          'FROM enemiesで、画面に並んでいるEnemy rowを読む。',
          'WHERE hp > 0で撃破済みのrowを除く。',
          'ORDER BY attackDamage DESCはattackDamageの大きい順。',
          'LIMIT 1で並べ替え後の先頭1rowだけを選ぶ。',
        ],
      },
      {
        id: 'priority-desc-alias',
        code: 'SELECT e.name, e.attackDamage\nFROM enemies AS e\nWHERE e.hp > 0\nORDER BY e.attackDamage DESC\nLIMIT 1;',
        lineMode: 'multi',
        codeHelpLines: [
          'AS eはenemiesを短い名前eで呼ぶためのalias。rowの意味は変わらない。',
          'WHEREで生存rowだけに絞る。',
          'DESCは大きい値から小さい値への並び順。',
          'LIMIT 1なので最終的な対象は1rowだけ。',
        ],
      },
    ],
  },
]

export const databaseSkillDefinitionById = Object.fromEntries(
  databaseSkillDefinitions.map((definition) => [definition.id, definition]),
) as Record<string, SkillDefinition>
