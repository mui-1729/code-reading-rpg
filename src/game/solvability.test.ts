import { describe, expect, it } from 'vitest'
import { generateBattle } from './generator'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'
import type { Battle } from './types'

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

  it('persistent HP・Defense・Party・PATCH KITをactual turn resolverと同じprofileで扱う', () => {
    const battle: Battle = {
      id: 99,
      areaId: 'javascript',
      label: 'PROFILE TEST',
      title: 'PROFILE TEST',
      subtitle: 'PROFILE TEST',
      recommendedLevel: 1,
      expReward: 0,
      goldReward: 0,
      enemies: [
        {
          id: 'durable-goblin',
          name: 'Goblin',
          role: 'standard',
          visualId: 'goblin',
          hp: 90,
          maxHp: 90,
          attackName: 'TEST',
          attackDamage: 10,
          glyph: '•',
        },
      ],
      skillIds: ['pulse'],
    }
    const lowHpProfile = {
      playerStats: {
        level: 1,
        maxHp: 100,
        powerMultiplier: 1,
        attack: 0,
        defense: 0,
      },
      initialPlayerHp: 5,
    }

    expect(isBattleSolvable(battle, lowHpProfile)).toBe(false)
    expect(isBattleSolvable(battle, { ...lowHpProfile, patchKitCount: 1 })).toBe(true)
    expect(
      isBattleSolvable(battle, {
        ...lowHpProfile,
        playerStats: { ...lowHpProfile.playerStats, attack: 120, defense: 30 },
        partyFollowUpDamage: 7,
      }),
    ).toBe(true)
  })
})
