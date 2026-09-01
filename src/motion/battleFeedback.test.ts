import { describe, expect, it } from 'vitest'
import type { Enemy, TargetRule } from '../game/types'
import { getTargets } from '../game/targeting'
import { getBattleSemanticFeedback } from './battleFeedback'

const enemy = (id: string, name: string, hp: number, attackDamage: number): Enemy => ({
  id,
  name,
  role: 'standard',
  visualId: 'enemy-fallback',
  hp,
  maxHp: Math.max(1, hp),
  attackName: 'TEST',
  attackDamage,
  glyph: '•',
})

const enemies = [
  enemy('a', 'Slime', 60, 4),
  enemy('b', 'Goblin', 34, 12),
  enemy('c', 'Boar', 48, 8),
]

const resolve = (rule: TargetRule) =>
  getBattleSemanticFeedback(rule, enemies, getTargets(enemies, rule))

describe('post-execution semantic feedback', () => {
  it('first-matchは最初の一致までだけtraceする', () => {
    expect(resolve({ kind: 'firstBelow', hp: 50 })).toMatchObject({
      family: 'first-match',
      tracedEnemyIds: ['a', 'b'],
      targetEnemyIds: ['b'],
    })
  })

  it('multi-matchは全候補を確認して通過targetを残す', () => {
    expect(resolve({ kind: 'allBelow', hp: 50 })).toMatchObject({
      family: 'multi-match',
      tracedEnemyIds: ['a', 'b', 'c'],
      targetEnemyIds: ['b', 'c'],
    })
  })

  it('some/everyはgroup gateとして区別する', () => {
    expect(resolve({ kind: 'allIfAnyBelow', hp: 40 }).family).toBe('gate-any')
    expect(resolve({ kind: 'allIfEveryBelow', hp: 70 }).family).toBe('gate-every')
  })

  it('sort系は実際のHP順をtrace順へ使う', () => {
    expect(resolve({ kind: 'lowestHp' })).toMatchObject({
      family: 'ordered',
      tracedEnemyIds: ['b', 'c', 'a'],
      targetEnemyIds: ['b'],
    })
  })

  it('reduce系は候補を順に比較して最終targetを示す', () => {
    expect(resolve({ kind: 'highestAttack' })).toMatchObject({
      family: 'reduced',
      tracedEnemyIds: ['a', 'b', 'c'],
      targetEnemyIds: ['b'],
    })
  })

  it('実行後feedbackなのでMATCHなしでも探索した候補を保持する', () => {
    expect(resolve({ kind: 'named', name: 'Missing' })).toMatchObject({
      family: 'first-match',
      tracedEnemyIds: ['a', 'b', 'c'],
      targetEnemyIds: [],
    })
  })
})
