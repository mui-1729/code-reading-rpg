import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { getSkillCardsForBattle } from './skills'

function normalizeDisplayedCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const encounterSeed = (ordinal: number) => `encounter:${ordinal}:10:11`

describe('battle code uniqueness', () => {
  it('コメントを除去しても異なるBattleで同じ表示コードを再利用しない', () => {
    for (let encounter = 1; encounter <= 8; encounter += 1) {
      const seen = new Map<string, number>()

      for (const battle of battles) {
        for (const skill of getSkillCardsForBattle(battle, encounterSeed(encounter))) {
          expect(skill.code).not.toMatch(/\/\*\s*B\d+-/)

          const normalized = normalizeDisplayedCode(skill.code)
          const previousBattleId = seen.get(normalized)
          expect(
            previousBattleId,
            `duplicate code in Battle ${battle.id} at encounter ${encounter}`,
          ).toBeUndefined()
          seen.set(normalized, battle.id)
        }
      }
    }
  })

  it('同じencounter seedならreloadしても同じコードを再現する', () => {
    for (const battle of battles) {
      const first = getSkillCardsForBattle(battle, encounterSeed(7)).map((skill) => skill.code)
      const replay = getSkillCardsForBattle(battle, encounterSeed(7)).map((skill) => skill.code)
      expect(replay).toEqual(first)
    }
  })

  it('連続するEncounterでは各Skillの表示コードが変わる', () => {
    for (const battle of battles) {
      for (let encounter = 1; encounter < 12; encounter += 1) {
        const current = new Map(
          getSkillCardsForBattle(battle, encounterSeed(encounter)).map((skill) => [
            skill.id,
            normalizeDisplayedCode(skill.code),
          ]),
        )
        const next = getSkillCardsForBattle(battle, encounterSeed(encounter + 1))

        for (const skill of next) {
          expect(
            normalizeDisplayedCode(skill.code),
            `${skill.id} repeated in consecutive encounters for Battle ${battle.id}`,
          ).not.toBe(current.get(skill.id))
        }
      }
    }
  })

  it('12 Encounterで各Skillに4種類以上の実コード表現が出る', () => {
    for (const battle of battles) {
      const codesBySkill = new Map<string, Set<string>>()

      for (let encounter = 1; encounter <= 12; encounter += 1) {
        for (const skill of getSkillCardsForBattle(battle, encounterSeed(encounter))) {
          const codes = codesBySkill.get(skill.id) ?? new Set<string>()
          codes.add(normalizeDisplayedCode(skill.code))
          codesBySkill.set(skill.id, codes)
        }
      }

      for (const [skillId, codes] of codesBySkill) {
        expect(
          codes.size,
          `${skillId} in Battle ${battle.id} has too few semantic variants`,
        ).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('同じSkillを別Battleで使う場合はbase variant poolが衝突しない', () => {
    const bySkill = new Map<string, Array<{ battleId: number; code: string }>>()

    for (const battle of battles) {
      for (const skill of getSkillCardsForBattle(battle, encounterSeed(3))) {
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
})
