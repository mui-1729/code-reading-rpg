import { JAVASCRIPT_AREA_ID } from './areas'
import type { Battle, Enemy } from './types'

const enemy = (
  id: string,
  name: string,
  hp: number,
  attackName: string,
  attackDamage: number,
  glyph: string,
): Enemy => ({ id, name, hp, maxHp: hp, attackName, attackDamage, glyph })

export const battles: Battle[] = [
  {
    id: 1,
    areaId: JAVASCRIPT_AREA_ID,
    label: 'BATTLE 01',
    title: 'First Read',
    subtitle: 'コードが選ぶ「対象」を読む',
    recommendedLevel: 1,
    expReward: 40,
    enemies: [
      enemy('slime-a', 'Slime', 34, 'Nibble', 6, '●'),
      enemy('goblin-a', 'Goblin', 72, 'Heavy Slash', 14, '▲'),
    ],
    skillIds: ['trace', 'pulse', 'nova'],
    unlockSkillId: 'viper',
  },
  {
    id: 2,
    areaId: JAVASCRIPT_AREA_ID,
    label: 'BATTLE 02',
    title: 'One or Many',
    subtitle: 'find と filter の違いを戦況で使い分ける',
    recommendedLevel: 2,
    expReward: 60,
    enemies: [
      enemy('slime-b', 'Slime', 42, 'Nibble', 6, '●'),
      enemy('goblin-b', 'Goblin', 68, 'Heavy Slash', 15, '▲'),
      enemy('golem-b', 'Golem', 124, 'Stone Fist', 9, '■'),
    ],
    skillIds: ['trace', 'pulse', 'nova', 'viper'],
    unlockSkillId: 'moon-edge',
  },
  {
    id: 3,
    areaId: JAVASCRIPT_AREA_ID,
    label: 'BATTLE 03',
    title: 'Priority Queue',
    subtitle: '次の攻撃とコードを読み、倒す順番を決める',
    recommendedLevel: 3,
    expReward: 100,
    isBoss: true,
    enemies: [
      enemy('slime-c', 'Slime', 46, 'Bite', 3, '●'),
      enemy('goblin-c', 'Goblin', 84, 'Execution', 8, '▲'),
      enemy('boss-c', 'Boss', 156, 'Meteor', 12, '◆'),
    ],
    skillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
  },
]
