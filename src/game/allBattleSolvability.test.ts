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
  // Keep every seed, but give each Battle its own assertion report and time budget.
  // A single 4,400-case test can exceed the default timeout during parallel CI.
  it.each(battleIds)(
    'Battle %iの全検証seedで選択semantic variantに初手の有効targetがある',
    (battleId) => {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        const skillCards = getSkillCardsForBattle(battle, seed)
        expect(
          hasInitialValidTarget(battle, skillCards),
          `Battle ${battleId} seed ${seed} has no valid initial target`,
        ).toBe(true)
      }
    },
  )

  it.each(battleIds)(
    'Battle %iの全検証seedで選択semantic variantのまま勝ち筋がある',
    (battleId) => {
      for (const seed of seeds) {
        const battle = requiredBattle(battleId, seed)
        const skillCards = getSkillCardsForBattle(battle, seed)
        expect(
          isBattleSolvable(battle, { skillCards }),
          `Battle ${battleId} seed ${seed} is not solvable`,
        ).toBe(true)
      }
    },
  )
})
