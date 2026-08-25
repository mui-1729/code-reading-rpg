import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import {
  generateBattle,
  getHpMultiplierForLevel,
  getHpMultiplierSteps,
} from './generator'
import { skills } from './skills'
import { getTargets } from './targeting'

describe('HP multiplier progression', () => {
  it('レベルに応じて目標倍率が0.05ずつ上がる', () => {
    expect(getHpMultiplierForLevel(1)).toBe(1)
    expect(getHpMultiplierForLevel(2)).toBe(1.05)
    expect(getHpMultiplierForLevel(3)).toBe(1.1)
    expect(getHpMultiplierForLevel(5)).toBe(1.2)
  })

  it('目標倍率から1.00まで0.05ずつ戻る', () => {
    expect(getHpMultiplierSteps(1)).toEqual([1])
    expect(getHpMultiplierSteps(2)).toEqual([1.05, 1])
    expect(getHpMultiplierSteps(4)).toEqual([1.15, 1.1, 1.05, 1])
  })
})

describe('generateBattle', () => {
  it('同じseed・battleId・levelなら同じ盤面を再現する', () => {
    expect(generateBattle(2, 'same-seed', 6)).toEqual(generateBattle(2, 'same-seed', 6))
  })

  it('異なるseedから複数の盤面パターンを生成する', () => {
    const patterns = new Set(
      Array.from({ length: 20 }, (_, index) =>
        JSON.stringify(generateBattle(2, `seed-${index}`, 2)),
      ),
    )

    expect(patterns.size).toBeGreaterThan(1)
  })

  it('元の固定Battle定義を変更しない', () => {
    const before = structuredClone(battles)

    generateBattle(1, 'immutable-1', 1)
    generateBattle(2, 'immutable-2', 4)
    generateBattle(3, 'immutable-3', 8)

    expect(battles).toEqual(before)
  })

  it('Skillの集合を維持したままカード順を可変化する', () => {
    const generated = generateBattle(3, 'skills', 3)
    if (!generated) throw new Error('Battle 3 was not generated')

    expect([...generated.skillIds].sort()).toEqual([...battles[2].skillIds].sort())
  })

  it('採用HPは基準HP以上かつレベル目標倍率以下になる', () => {
    for (const template of battles) {
      for (let level = 1; level <= 10; level += 1) {
        const targetMultiplier = getHpMultiplierForLevel(level)
        const generated = generateBattle(template.id, `level-${template.id}-${level}`, level)
        if (!generated) throw new Error(`Battle ${template.id} was not generated`)

        for (const enemy of generated.enemies) {
          const baseEnemy = template.enemies.find((candidate) => candidate.id === enemy.id)
          if (!baseEnemy) throw new Error(`Base enemy ${enemy.id} was not found`)

          expect(enemy.hp).toBeGreaterThanOrEqual(baseEnemy.maxHp)
          expect(enemy.hp).toBeLessThanOrEqual(Math.round(baseEnemy.maxHp * targetMultiplier))
          expect(enemy.maxHp).toBe(enemy.hp)
        }
      }
    }
  })

  it('元Battleで初手から有効なSkillは高レベル生成後も有効対象を持つ', () => {
    for (const template of battles) {
      const requiredSkillIds = template.skillIds.filter((skillId) => {
        const skill = skills[skillId]
        return skill ? getTargets(template.enemies, skill.rule).length > 0 : false
      })

      for (let index = 0; index < 30; index += 1) {
        const generated = generateBattle(template.id, `learning-${template.id}-${index}`, 12)
        if (!generated) throw new Error(`Battle ${template.id} was not generated`)

        for (const skillId of requiredSkillIds) {
          const skill = skills[skillId]
          expect(getTargets(generated.enemies, skill.rule).length).toBeGreaterThan(0)
        }
      }
    }
  })
})
