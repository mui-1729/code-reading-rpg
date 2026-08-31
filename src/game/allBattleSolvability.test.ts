import { describe, expect, it } from 'vitest'
import { generateBattle } from './generator'
import { getSkillCardsForBattle } from './skills'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'

const battleIds = Array.from({ length: 22 }, (_, index) => index + 1)
const seeds = Array.from({ length: 200 }, (_, index) => `all-solvability-${index}`)

const requiredBattle = (battleId: number, seed: string) => {
  const battle = generateBattle(battleId, seed)
  if (!battle) throw new Error(`Battle ${battleId} seed ${seed} could not be generated`)
  return battle
}

describe('all battle solvability regression', () => {
  it('Battle 1〜22の全検証seedで選択semantic variantに初手の有効targetがある', () => {
    for (const battleId of battleIds) {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        const skillCards = getSkillCardsForBattle(battle, seed)
        expect(
          hasInitialValidTarget(battle, skillCards),
          `Battle ${battleId} seed ${seed} has no valid initial target`,
        ).toBe(true)
      }
    }
  })

  it('Battle 1〜22の全検証seedで選択semantic variantのまま勝ち筋がある', () => {
    for (const battleId of battleIds) {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        const skillCards = getSkillCardsForBattle(battle, seed)
        expect(
          isBattleSolvable(battle, { skillCards }),
          `Battle ${battleId} seed ${seed} is not solvable`,
        ).toBe(true)
      }
    }
  })
})
