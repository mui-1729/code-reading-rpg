import { DATABASE_AREA_ID } from './areas'
import type { Battle, Enemy } from './types'

const rowEnemy = (
  id: string,
  name: string,
  hp: number,
  attackName: string,
  attackDamage: number,
  glyph: string,
): Enemy => ({ id, name, hp, maxHp: hp, attackName, attackDamage, glyph })

export const DATABASE_PROTOTYPE_BATTLE_ID = 23

export const databaseBattles: readonly Battle[] = [
  {
    id: DATABASE_PROTOTYPE_BATTLE_ID,
    areaId: DATABASE_AREA_ID,
    label: 'ARCHIVE QUERY 01',
    title: '消えた優先レコード',
    subtitle:
      'Archiveの防衛端末が危険度の高いrowを取り違えている。queryと保存されたrowを読み、実際に返る1件を特定して処理を復旧しよう',
    recommendedLevel: 4,
    expReward: 54,
    goldReward: 28,
    enemies: [
      rowEnemy('archive-slime', 'Archive Slime', 52, 'Record Nibble', 6, '▤'),
      rowEnemy('index-goblin', 'Index Goblin', 78, 'Index Slash', 13, '▥'),
      rowEnemy('vault-golem', 'Vault Golem', 112, 'Storage Fist', 9, '▦'),
    ],
    skillIds: ['db-priority-row'],
    multiLineSkillIds: ['db-priority-row'],
  },
]
