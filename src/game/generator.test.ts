import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { generateBattle } from './generator'
import { skills } from './skills'
import { getTargets } from './targeting'

describe('generateBattle', () => {
  it('同じseedとbattleIdなら同じ盤面を再現する', () => {
    expect(generateBattle(2, 'same-seed')).toEqual(generateBattle(2, 'same-seed'))
  })

  it('異なるseedから複数の盤面パターンを生成する', () => {
    const patterns = new Set(
      Array.from({ length: 20 }, (_, index) => JSON.stringify(generateBattle(2, `seed-${index}`))),
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

  it('Skillの集合を維持したままカード順を可変化する', () => {
    const generated = generateBattle(3, 'skills')
    if (!generated) throw new Error('Battle 3 was not generated')

    expect([...generated.skillIds].sort()).toEqual([...battles[2].skillIds].sort())
  })

  it('基準HPに0.85〜1.15の倍率を掛けた範囲でHPを生成する', () => {
    for (const template of battles) {
      for (let index = 0; index < 50; index += 1) {
        const generated = generateBattle(template.id, `multiplier-${template.id}-${index}`)
        if (!generated) throw new Error(`Battle ${template.id} was not generated`)

        for (const enemy of generated.enemies) {
          const baseEnemy = template.enemies.find((candidate) => candidate.id === enemy.id)
          if (!baseEnemy) throw new Error(`Base enemy ${enemy.id} was not found`)

          const minHp = Math.round(baseEnemy.maxHp * 0.85)
          const maxHp = Math.round(baseEnemy.maxHp * 1.15)
          expect(enemy.hp).toBeGreaterThanOrEqual(minHp)
          expect(enemy.hp).toBeLessThanOrEqual(maxHp)
          expect(enemy.maxHp).toBe(enemy.hp)
        }
      }
    }
  })

  it('元Battleで初手から有効なSkillは生成後も有効対象を持つ', () => {
    for (const template of battles) {
      const requiredSkillIds = template.skillIds.filter((skillId) => {
        const skill = skills[skillId]
        return skill ? getTargets(template.enemies, skill.rule).length > 0 : false
      })

      for (let index = 0; index < 50; index += 1) {
        const generated = generateBattle(template.id, `learning-${template.id}-${index}`)
        if (!generated) throw new Error(`Battle ${template.id} was not generated`)

        for (const skillId of requiredSkillIds) {
          const skill = skills[skillId]
          expect(getTargets(generated.enemies, skill.rule).length).toBeGreaterThan(0)
        }
      }
    }
  })
})
