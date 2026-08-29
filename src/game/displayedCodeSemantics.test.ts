import { describe, expect, it } from 'vitest'
import { allSkillDefinitionById } from './skills'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (
  id: string,
  name: string,
  hp: number,
  attackDamage: number,
): Enemy => ({
  id,
  name,
  hp,
  maxHp: Math.max(hp, 100),
  attackName: 'Test Attack',
  attackDamage,
  glyph: '•',
})

function stripSupportedTypeScriptSyntax(code: string) {
  return code
    .replace(/\(enemies as Enemy\[\]\)/g, 'enemies')
    .replace(/\((\w+): Enemy\): boolean/g, '($1)')
    .replace(/\((\w+): Enemy\)/g, '($1)')
}

function evaluateDisplayedTargets(code: string, allEnemies: Enemy[]): string[] {
  // The Battle code context intentionally exposes only living enemies. This oracle evaluates the
  // displayed expression itself and does not reuse TargetRule/getTargets implementation details.
  const enemies = allEnemies.filter((candidate) => candidate.hp > 0)
  const executable = stripSupportedTypeScriptSyntax(code)
  const evaluate = new Function('enemies', `"use strict"; return (${executable});`) as (
    enemies: Enemy[],
  ) => Enemy | Enemy[] | undefined
  const result = evaluate(enemies)
  if (!result) return []
  return (Array.isArray(result) ? result : [result]).map((target) => target.id)
}

describe('displayed code semantic invariant', () => {
  const board = [
    enemy('dead-slime', 'Slime', 0, 20),
    enemy('low-goblin', 'Goblin', 30, 8),
    enemy('high-slime', 'Slime', 90, 14),
  ]

  const cases = [
    'trace',
    'pulse',
    'viper',
    'lock',
    'ts-scan',
    'ts-guard',
    'ts-label',
  ] as const

  it.each(cases)('%sのdisplayed codeとruntime targetがdead/alive混在でも一致する', (skillId) => {
    const definition = allSkillDefinitionById[skillId]
    const displayed = definition.codeVariants.find((variant) => variant.lineMode === 'single')
    expect(displayed).toBeDefined()

    const displayTargets = evaluateDisplayedTargets(displayed?.code ?? '', board)
    const runtimeTargets = getTargets(board, definition.rule).map((target) => target.id)

    expect(runtimeTargets).toEqual(displayTargets)
  })

  it('dead Enemyが先頭でもTRACEはcode context上の最初のliving matchを選ぶ', () => {
    const trace = allSkillDefinitionById.trace
    const displayed = trace.codeVariants[0]

    expect(evaluateDisplayedTargets(displayed.code, board)).toEqual(['low-goblin'])
    expect(getTargets(board, trace.rule).map((target) => target.id)).toEqual(['low-goblin'])
  })
})
