import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'

const byName = (battleId: number, seed: string, name: string) => {
  const battle = generateBattle(battleId, seed)
  if (!battle) throw new Error(`Battle ${battleId} was not generated`)

  const enemy = battle.enemies.find((candidate) => candidate.name === name)
  if (!enemy) throw new Error(`${name} was not generated for Battle ${battleId}`)

  return enemy
}

describe('generateBattle', () => {
  it('同じseedとbattleIdなら同じ盤面を再現する', () => {
    expect(generateBattle(2, 'same-seed')).toEqual(generateBattle(2, 'same-seed'))
  })

  it('異なるseedから複数の盤面パターンを生成する', () => {
    const patterns = new Set(
      Array.from({ length: 12 }, (_, index) => JSON.stringify(generateBattle(2, `seed-${index}`))),
    )

    expect(patterns.size).toBeGreaterThan(1)
  })

  it('元の固定Battle定義を変更しない', () => {
    const before = structuredClone(battles)

    generateBattle(1, 'immutable-1')
    generateBattle(2, 'immutable-2')
    generateBattle(3, 'immutable-3')

    expect(battles).toEqual(before)
  })

  it('Skillの集合を維持したままカード順だけを可変化する', () => {
    const generated = generateBattle(3, 'skills')
    if (!generated) throw new Error('Battle 3 was not generated')

    expect([...generated.skillIds].sort()).toEqual([...battles[2].skillIds].sort())
  })

  it('Battle 1はSlimeを45未満、Goblinを60より大きく保つ', () => {
    for (let index = 0; index < 30; index += 1) {
      const seed = `battle-1-${index}`
      expect(byName(1, seed, 'Slime').hp).toBeLessThan(45)
      expect(byName(1, seed, 'Goblin').hp).toBeGreaterThan(60)
    }
  })

  it('Battle 2はSlimeを45未満、Goblin/Golemを60より大きく保つ', () => {
    for (let index = 0; index < 30; index += 1) {
      const seed = `battle-2-${index}`
      expect(byName(2, seed, 'Slime').hp).toBeLessThan(45)
      expect(byName(2, seed, 'Goblin').hp).toBeGreaterThan(60)
      expect(byName(2, seed, 'Golem').hp).toBeGreaterThan(60)
    }
  })

  it('Battle 3はSlimeを55未満かつ45より大きく、Goblin/Bossを60より大きく保つ', () => {
    for (let index = 0; index < 30; index += 1) {
      const seed = `battle-3-${index}`
      const slime = byName(3, seed, 'Slime')

      expect(slime.hp).toBeGreaterThan(45)
      expect(slime.hp).toBeLessThan(55)
      expect(byName(3, seed, 'Goblin').hp).toBeGreaterThan(60)
      expect(byName(3, seed, 'Boss').hp).toBeGreaterThan(60)
    }
  })
})
