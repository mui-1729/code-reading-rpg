import { DATABASE_AREA_ID } from './areas'
import type { Battle, Enemy } from './types'

const enemy = (
  id: string,
  name: string,
  hp: number,
  attackDamage: number,
  visualId: string,
  glyph: string,
): Enemy => ({
  id,
  name,
  role: 'standard',
  visualId,
  hp,
  maxHp: hp,
  attackName: 'Archive Pulse',
  attackDamage,
  glyph,
})

export const databaseBattle: Battle = {
  id: 23,
  areaId: DATABASE_AREA_ID,
  label: 'DB-01 · ARCHIVE QUERY',
  title: '優先処理rowを読み取る',
  subtitle:
    '保存されたEnemy rowとSQL queryを対応させる。WHEREで候補を残し、ORDER BYで順番を決め、LIMITで最終resultを読む。',
  recommendedLevel: 4,
  expReward: 90,
  goldReward: 45,
  enemies: [
    enemy('archive-sprout', 'Sprout', 58, 7, 'sprout', '♣'),
    enemy('archive-goblin', 'Goblin', 76, 13, 'goblin', '▲'),
    enemy('archive-golem', 'Golem', 118, 10, 'golem', '■'),
  ],
  skillIds: ['query-focus', 'query-lowest-hp'],
  multiLineSkillIds: ['query-focus', 'query-lowest-hp'],
}
