import { DATABASE_AREA_ID } from './areas'
import type { SkillDefinition } from './skillDefinitions'
import type { Battle } from './types'

export const DATABASE_PROTOTYPE_BATTLE_ID = 23

export const databaseSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'db-where',
    name: 'WHERE TRACE',
    power: 46,
    rule: { kind: 'firstBelow', hp: 60 },
    concept: 'SELECT / WHERE / LIMIT',
    explanation:
      'WHERE は「どのrowを残すか」という条件です。上から条件を確認し、hpが60未満のrowのうち最初の1件だけをLIMIT 1で選びます。',
    codeVariants: [
      {
        id: 'query',
        lineMode: 'multi',
        code: 'SELECT name, hp\nFROM enemies\nWHERE hp < 60\nLIMIT 1;',
        codeHelpLines: [
          'SELECT name, hp // 結果として見るcolumnを決める',
          'FROM enemies // enemies tableを調べる',
          'WHERE hp < 60 // hpが60未満のrowだけ残す',
          'LIMIT 1 // 条件に合う先頭1件だけ返す',
        ],
      },
    ],
  },
  {
    id: 'db-order',
    name: 'ORDER LOCK',
    power: 52,
    rule: { kind: 'highestAttack' },
    concept: 'SELECT / ORDER BY / LIMIT',
    explanation:
      'ORDER BY はrowの並び順を変えます。attackDamageをDESC（大きい順）に並べ、LIMIT 1なので一番attackDamageが高いrowを1件だけ選びます。',
    codeVariants: [
      {
        id: 'query',
        lineMode: 'multi',
        code: 'SELECT name, attackDamage\nFROM enemies\nORDER BY attackDamage DESC\nLIMIT 1;',
        codeHelpLines: [
          'SELECT name, attackDamage // 見たいcolumnを選ぶ',
          'FROM enemies // enemies tableが対象',
          'ORDER BY attackDamage DESC // attackDamageの大きい順に並べる',
          'LIMIT 1 // 並び替え後の先頭1件だけ返す',
        ],
      },
    ],
  },
  {
    id: 'db-row',
    name: 'ROW MATCH',
    power: 50,
    rule: { kind: 'named', name: 'Stale Row' },
    concept: 'SELECT / WHERE',
    explanation:
      '文字列もWHEREの条件にできます。nameがStale Rowと一致するrowだけを残すqueryです。',
    codeVariants: [
      {
        id: 'query',
        lineMode: 'multi',
        code: "SELECT name, hp\nFROM enemies\nWHERE name = 'Stale Row';",
        codeHelpLines: [
          'SELECT name, hp // nameとhpを結果として見る',
          'FROM enemies // enemies tableを読む',
          "WHERE name = 'Stale Row' // nameが一致するrowだけ残す",
        ],
      },
    ],
  },
]

export const databasePrototypeBattle: Battle = {
  id: DATABASE_PROTOTYPE_BATTLE_ID,
  areaId: DATABASE_AREA_ID,
  label: 'ARCHIVE QUERY 01 · PROTOTYPE',
  title: '返ってくるrowを見抜く',
  subtitle:
    '障害調査用queryが別のrecordを拾っている。tableのrowとSELECT / WHERE / ORDER BY / LIMITを上から読み、queryが返すrecordを特定しよう',
  recommendedLevel: 4,
  expReward: 60,
  goldReward: 30,
  enemies: [
    {
      id: 'db-cache-row',
      name: 'Cache Row',
      hp: 44,
      maxHp: 44,
      attackName: 'Duplicate Result',
      attackDamage: 5,
      glyph: '▤',
    },
    {
      id: 'db-stale-row',
      name: 'Stale Row',
      hp: 72,
      maxHp: 72,
      attackName: 'Stale Write',
      attackDamage: 8,
      glyph: '▥',
    },
    {
      id: 'db-hot-row',
      name: 'Hot Row',
      hp: 96,
      maxHp: 96,
      attackName: 'Lock Wait',
      attackDamage: 12,
      glyph: '▦',
    },
  ],
  skillIds: databaseSkillDefinitions.map((skill) => skill.id),
  multiLineSkillIds: databaseSkillDefinitions.map((skill) => skill.id),
}
