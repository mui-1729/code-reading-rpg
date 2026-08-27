import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { getSkillCardsForBattle } from './skills'

function normalizeDisplayedCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('battle code uniqueness', () => {
  it('コメントを除去しても異なるBattleで同じ表示コードを再利用しない', () => {
    const seen = new Map<string, number>()

    for (const battle of battles) {
      for (const skill of getSkillCardsForBattle(battle, 'shared-seed')) {
        expect(skill.code).not.toMatch(/\/\*\s*B\d+-/)

        const normalized = normalizeDisplayedCode(skill.code)
        const previousBattleId = seen.get(normalized)
        expect(previousBattleId, `duplicate code in Battle ${battle.id}`).toBeUndefined()
        seen.set(normalized, battle.id)
      }
    }
  })

  it('同じSkillを別Battleで使う場合はbase variant自体が変わる', () => {
    const bySkill = new Map<string, Array<{ battleId: number; code: string }>>()

    for (const battle of battles) {
      for (const skill of getSkillCardsForBattle(battle, 'shared-seed')) {
        const entries = bySkill.get(skill.id) ?? []
        entries.push({ battleId: battle.id, code: normalizeDisplayedCode(skill.code) })
        bySkill.set(skill.id, entries)
      }
    }

    for (const entries of bySkill.values()) {
      if (entries.length < 2) continue
      expect(new Set(entries.map((entry) => entry.code)).size).toBe(entries.length)
    }
  })

  it('同じseedなら再現し、別seedでは同値な比較表現が変わる', () => {
    for (const battle of battles) {
      const first = getSkillCardsForBattle(battle, 'seed-a').map((skill) => skill.code)
      const replay = getSkillCardsForBattle(battle, 'seed-a').map((skill) => skill.code)
      const another = getSkillCardsForBattle(battle, 'seed-b').map((skill) => skill.code)

      expect(replay).toEqual(first)
      expect(another).not.toEqual(first)
      expect(first.concat(another).some((code) => /\d+\s*(?:>|<|>=|<=)\s*\w+\.(?:hp|attackDamage)/.test(code))).toBe(true)
    }
  })
})
