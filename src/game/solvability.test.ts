import { describe, expect, it } from 'vitest'
import { generateBattle } from './generator'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'

const battleIds = [1, 2, 3, 4, 5, 6] as const
const seeds = Array.from({ length: 100 }, (_, index) => `solvability-${index}`)

const requiredBattle = (battleId: number, seed: string) => {
  const battle = generateBattle(battleId, seed)
  if (!battle) throw new Error(`Battle ${battleId} seed ${seed} could not be generated`)
  return battle
}

describe('variable battle validation', () => {
  it('同じbattleIdとseedから完全に同じ盤面を再現する', () => {
    for (const battleId of battleIds) {
      for (const seed of seeds.slice(0, 20)) {
        expect(requiredBattle(battleId, seed)).toEqual(requiredBattle(battleId, seed))
      }
    }
  })

  it('各Battleで複数seedから複数の盤面パターンを生成する', () => {
    for (const battleId of battleIds) {
      const patterns = new Set(
        seeds.slice(0, 30).map((seed) => JSON.stringify(requiredBattle(battleId, seed))),
      )

      expect(patterns.size).toBeGreaterThan(1)
    }
  })

  it('全検証seedで初手から少なくとも1つ有効対象を持つ', () => {
    for (const battleId of battleIds) {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        if (!hasInitialValidTarget(battle)) {
          throw new Error(`Battle ${battleId} seed ${seed} has no valid initial target`)
        }
      }
    }
  })

  it('Battle 1〜6の全検証seedに勝ち筋がある', () => {
    for (const battleId of battleIds) {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        if (!isBattleSolvable(battle)) {
          throw new Error(`Battle ${battleId} seed ${seed} is not solvable`)
        }
      }
    }
  })
})
