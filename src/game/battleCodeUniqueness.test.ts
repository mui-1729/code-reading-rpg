import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { getSkillCardsForBattle } from './skills'

describe('battle code uniqueness', () => {
  it('異なるBattleで同じ表示コード文字列を再利用しない', () => {
    const seen = new Map<string, number>()

    for (const battle of battles) {
      for (const skill of getSkillCardsForBattle(battle, 'shared-seed')) {
        const previousBattleId = seen.get(skill.code)
        expect(previousBattleId, `duplicate code in Battle ${battle.id}`).toBeUndefined()
        seen.set(skill.code, battle.id)
      }
    }
  })

  it('同じseedなら再現し、別seedなら暗記しづらい別表示になる', () => {
    for (const battle of battles) {
      const first = getSkillCardsForBattle(battle, 'seed-a').map((skill) => skill.code)
      const replay = getSkillCardsForBattle(battle, 'seed-a').map((skill) => skill.code)
      const another = getSkillCardsForBattle(battle, 'seed-b').map((skill) => skill.code)

      expect(replay).toEqual(first)
      expect(another).not.toEqual(first)
    }
  })
})
