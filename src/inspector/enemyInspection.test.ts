import { describe, expect, it } from 'vitest'
import {
  createCodeDataVariables,
  createEnemyInspectionSnapshot,
  type RuntimeEnemy,
} from './enemyInspection'

const enemies: RuntimeEnemy[] = [
  {
    key: 'goblin',
    name: 'Goblin',
    hp: 38,
    maxHp: 60,
    attackName: 'Slash',
    attackDamage: 14,
    incomingDamage: 11,
  },
  {
    key: 'slime',
    name: 'Slime',
    hp: 0,
    maxHp: 42,
    attackName: 'Bounce',
    attackDamage: 6,
    incomingDamage: 3,
  },
  {
    key: 'knight',
    name: 'Knight',
    hp: 82,
    maxHp: 82,
    attackName: 'Cut',
    attackDamage: 10,
    incomingDamage: 7,
  },
]

const runtimeRef = (name: string, hp: number, attackDamage: number, incomingDamage: number) => ({
  name,
  hp,
  attackDamage,
  incomingDamage,
})

describe('runtime code data', () => {
  it('GUARD表示codeが参照するstable roleを確認できる', () => {
    const boss = { ...enemies[0], role: 'boss' }
    expect(createEnemyInspectionSnapshot(boss, null).base).toContainEqual({ name: 'role', expression: 'enemy.role', value: 'boss' })
    const data = createCodeDataVariables([boss], null)
    expect(data[0].value).toEqual([expect.objectContaining({ role: 'boss' })])
  })
  it('Enemy objectのraw値とPlayer DEF適用後damageを別項目で確認できる', () => {
    const snapshot = createEnemyInspectionSnapshot(enemies[0], null)

    expect(Object.fromEntries(snapshot.base.map((item) => [item.name, item.value]))).toEqual({
      name: 'Goblin',
      hp: 38,
      maxHp: 60,
      attackName: 'Slash',
      attackDamage: 14,
      incomingDamage: 11,
    })
  })

  it('score = enemy.attackDamageはincomingDamageではなくraw値を使う', () => {
    const code = 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst scored = alive.map(enemy => ({ enemy, score: enemy.attackDamage }))'
    const snapshot = createEnemyInspectionSnapshot(enemies[0], code)

    expect(snapshot.derived).toEqual([
      { name: 'in alive', expression: 'enemy.hp > 0', value: true },
      { name: 'score', expression: 'enemy.attackDamage', value: 14 },
    ])
  })

  it('code contextのenemiesは生存Enemyだけを公開する', () => {
    const variables = createCodeDataVariables(enemies, null)
    const runtimeEnemies = variables.find((item) => item.name === 'enemies')

    expect(runtimeEnemies?.expression).toBe('current living enemies (hp > 0)')
    expect(runtimeEnemies?.value).toEqual([
      runtimeRef('Goblin', 38, 14, 11),
      runtimeRef('Knight', 82, 10, 7),
    ])
  })

  it('enemies / alive / scoredを現在値から作れる', () => {
    const code = 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst scored = alive.map(enemy => ({ enemy, score: enemy.attackDamage }))'
    const variables = createCodeDataVariables(enemies, code)

    expect(variables.map((item) => item.name)).toEqual(['enemies', 'alive', 'scored'])
    expect(variables.find((item) => item.name === 'alive')?.value).toEqual([
      runtimeRef('Goblin', 38, 14, 11),
      runtimeRef('Knight', 82, 10, 7),
    ])
    expect(variables.find((item) => item.name === 'scored')?.value).toEqual([
      { name: 'Goblin', score: 14 },
      { name: 'Knight', score: 10 },
    ])
  })

  it('hasWounded / allStableのboolean中間値を確認できる', () => {
    const hasWounded = createCodeDataVariables(
      enemies,
      'const alive = enemies.filter(e => e.hp > 0)\nconst hasWounded = alive.some(e => e.hp < 50)',
    )
    const allStable = createCodeDataVariables(
      enemies,
      'const alive = enemies.filter(({ hp }) => hp > 0)\nconst allStable = alive.every(({ hp }) => hp >= 50)',
    )

    expect(hasWounded.find((item) => item.name === 'hasWounded')?.value).toBe(true)
    expect(allStable.find((item) => item.name === 'allStable')?.value).toBe(false)
  })

  it('orderedはHP昇順の途中配列を返す', () => {
    const variables = createCodeDataVariables(
      enemies,
      'const alive = enemies.filter(e => e.hp > 0)\nconst ordered = [...alive].sort((a, b) => a.hp - b.hp)',
    )

    expect(variables.find((item) => item.name === 'ordered')?.value).toEqual([
      runtimeRef('Goblin', 38, 14, 11),
      runtimeRef('Knight', 82, 10, 7),
    ])
  })

  it('Deep Forestのliving / byHp / wrappedを現在盤面から確認できる', () => {
    const orderVariables = createCodeDataVariables(
      enemies,
      'const living = enemies.filter(e => e.hp > 0)\nconst byHp = [...living].sort((a, b) => a.hp - b.hp)\nbyHp[0]',
    )
    const safeCode = 'const living = enemies.filter(e => e.hp > 0)\nconst wrapped = living.map(e => ({ enemy: e, stats: { hp: e.hp } }))\nwrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy'
    const safeVariables = createCodeDataVariables(enemies, safeCode)
    const snapshot = createEnemyInspectionSnapshot(enemies[0], safeCode)

    expect(orderVariables.map((item) => item.name)).toEqual(['enemies', 'living', 'byHp'])
    expect(orderVariables.find((item) => item.name === 'byHp')?.value).toEqual([
      runtimeRef('Goblin', 38, 14, 11),
      runtimeRef('Knight', 82, 10, 7),
    ])
    expect(safeVariables.map((item) => item.name)).toEqual(['enemies', 'living', 'wrapped'])
    expect(safeVariables.find((item) => item.name === 'wrapped')?.value).toEqual([
      { name: 'Goblin', 'stats.hp': 38 },
      { name: 'Knight', 'stats.hp': 82 },
    ])
    expect(snapshot.derived).toEqual([
      { name: 'in living', expression: 'enemy.hp > 0', value: true },
      { name: 'stats.hp', expression: 'enemy.hp', value: 38 },
    ])
  })

  it('TypeScriptのlimit / scan由来のruntime値を確認できる', () => {
    const limit = createCodeDataVariables(
      enemies,
      'type Limit = 40 | 60\nconst limit: Limit = 60\nenemies.filter((enemy: Enemy) => enemy.hp < limit)',
    )
    const scan = createCodeDataVariables(
      enemies,
      'type Scan = { limit?: number }\nconst scan: Scan = { limit: 75 }\nconst limit = scan.limit',
    )

    expect(limit.find((item) => item.name === 'limit')?.value).toBe(60)
    expect(scan.find((item) => item.name === 'scan.limit')?.value).toBe(75)
    expect(scan.find((item) => item.name === 'limit')?.value).toBe(75)
  })

  it('resolverは入力Enemyをmutationしない', () => {
    const original = structuredClone(enemies)
    createCodeDataVariables(enemies, 'const alive = enemies.filter(e => e.hp > 0)')
    createEnemyInspectionSnapshot(enemies[0], 'const key = "hp" as const')
    expect(enemies).toEqual(original)
  })
})
