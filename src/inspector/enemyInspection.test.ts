import { describe, expect, it } from 'vitest'
import type { Enemy, SkillCard } from '../game/types'
import { createEnemyInspectionSnapshot } from './enemyInspection'

const enemy: Enemy = {
  id: 'goblin-a',
  name: 'Goblin',
  hp: 38,
  maxHp: 60,
  attackName: 'Slash',
  attackDamage: 14,
  glyph: 'G',
}

const makeSkill = (id: string, codeVariantId: string): SkillCard => ({
  id,
  name: id.toUpperCase(),
  code: '',
  codeVariantId,
  power: 1,
  rule: { kind: 'highestAttack' },
  concept: '',
  explanation: '',
})

describe('enemy data inspector', () => {
  it('現在のEnemy base dataをsnapshot化する', () => {
    const snapshot = createEnemyInspectionSnapshot(enemy, null)

    expect(Object.fromEntries(snapshot.base.map((item) => [item.key, item.value]))).toEqual({
      id: 'goblin-a',
      name: 'Goblin',
      hp: 38,
      maxHp: 60,
      attackName: 'Slash',
      attackDamage: 14,
    })
    expect(snapshot.derived).toEqual([])
  })

  it('JUDGEのscored variantではscore = enemy.attackDamageを確認できる', () => {
    const snapshot = createEnemyInspectionSnapshot(enemy, makeSkill('judge', 'scored-enemy'))

    expect(snapshot.derived).toEqual([
      { key: 'in alive', expression: 'enemy.hp > 0', value: true },
      { key: 'score', expression: 'enemy.attackDamage', value: 14 },
    ])
  })

  it('MOON EDGEのnested-safeではstats.hp = enemy.hpを確認できる', () => {
    const snapshot = createEnemyInspectionSnapshot(enemy, makeSkill('moon-edge', 'nested-safe'))

    expect(snapshot.derived).toEqual([
      { key: 'in alive', expression: 'enemy.hp > 0', value: true },
      { key: 'stats.hp', expression: 'enemy.hp', value: 38 },
    ])
  })

  it('defeated Enemyではalive由来の一時値を作らない', () => {
    const defeated = { ...enemy, hp: 0 }
    const snapshot = createEnemyInspectionSnapshot(defeated, makeSkill('judge', 'scored-short'))

    expect(snapshot.derived).toEqual([
      { key: 'in alive', expression: 'enemy.hp > 0', value: false },
    ])
  })

  it('inspection snapshot作成でEnemyをmutationしない', () => {
    const original = { ...enemy }
    createEnemyInspectionSnapshot(enemy, makeSkill('judge', 'scored-short'))
    expect(enemy).toEqual(original)
  })
})
