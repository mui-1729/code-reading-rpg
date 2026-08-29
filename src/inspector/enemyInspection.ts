export type RuntimeEnemy = {
  key: string
  name: string
  hp: number
  maxHp: number
  attackName: string
  /** Raw Enemy model value used by displayed code / TargetRule. */
  attackDamage: number
  /** Player-defense-adjusted damage shown by NEXT. */
  incomingDamage: number
}

export type CodeDataValue =
  | string
  | number
  | boolean
  | null
  | readonly Record<string, string | number | boolean | null>[]

export type CodeDataVariable = {
  name: string
  expression?: string
  value: CodeDataValue
}

export type EnemyInspectionSnapshot = {
  base: readonly CodeDataVariable[]
  derived: readonly CodeDataVariable[]
}

const enemyRef = (enemy: RuntimeEnemy) => ({
  name: enemy.name,
  hp: enemy.hp,
  attackDamage: enemy.attackDamage,
  incomingDamage: enemy.incomingDamage,
})

const aliveEnemies = (enemies: readonly RuntimeEnemy[]) => enemies.filter((enemy) => enemy.hp > 0)

export function createEnemyInspectionSnapshot(
  enemy: RuntimeEnemy,
  code: string | null,
): EnemyInspectionSnapshot {
  const base: CodeDataVariable[] = [
    { name: 'name', expression: 'enemy.name', value: enemy.name },
    { name: 'hp', expression: 'enemy.hp', value: enemy.hp },
    { name: 'maxHp', expression: 'enemy.maxHp', value: enemy.maxHp },
    { name: 'attackName', expression: 'enemy.attackName', value: enemy.attackName },
    { name: 'attackDamage', expression: 'enemy.attackDamage (raw)', value: enemy.attackDamage },
    {
      name: 'incomingDamage',
      expression: 'damage after player DEF',
      value: enemy.incomingDamage,
    },
  ]

  if (!code) return { base, derived: [] }

  const derived: CodeDataVariable[] = []

  if (code.includes('const alive') || code.includes('const living')) {
    const collectionName = code.includes('const living') ? 'living' : 'alive'
    derived.push({
      name: `in ${collectionName}`,
      expression: 'enemy.hp > 0',
      value: enemy.hp > 0,
    })
  }

  if (code.includes('score:') && code.includes('attackDamage')) {
    derived.push({ name: 'score', expression: 'enemy.attackDamage', value: enemy.attackDamage })
  }

  if (code.includes('stats: { hp:')) {
    derived.push({ name: 'stats.hp', expression: 'enemy.hp', value: enemy.hp })
  }

  if (code.includes('const key = "hp"')) {
    derived.push({ name: 'enemy[key]', expression: 'enemy.hp', value: enemy.hp })
  }

  if (code.includes('const readHp')) {
    derived.push({ name: 'readHp(enemy)', expression: 'enemy.hp', value: enemy.hp })
  }

  return { base, derived }
}

export function createCodeDataVariables(
  enemies: readonly RuntimeEnemy[],
  code: string | null,
): readonly CodeDataVariable[] {
  const alive = aliveEnemies(enemies)
  const values: CodeDataVariable[] = [
    {
      name: 'enemies',
      expression: 'current living enemies (hp > 0)',
      value: alive.map(enemyRef),
    },
  ]

  if (!code) return values

  if (code.includes('const alive')) {
    values.push({
      name: 'alive',
      expression: 'enemies.filter(enemy => enemy.hp > 0)',
      value: alive.map(enemyRef),
    })
  }

  if (code.includes('const living')) {
    values.push({
      name: 'living',
      expression: 'enemies.filter(enemy => enemy.hp > 0)',
      value: alive.map(enemyRef),
    })
  }

  if (code.includes('const ordered')) {
    values.push({
      name: 'ordered',
      expression: '[...alive].sort((a, b) => a.hp - b.hp)',
      value: [...alive].sort((left, right) => left.hp - right.hp).map(enemyRef),
    })
  }

  if (code.includes('const byHp')) {
    values.push({
      name: 'byHp',
      expression: '[...living].sort((a, b) => a.hp - b.hp)',
      value: [...alive].sort((left, right) => left.hp - right.hp).map(enemyRef),
    })
  }

  if (code.includes('const wrapped')) {
    const sourceName = code.includes('const living') ? 'living' : 'alive'
    values.push({
      name: 'wrapped',
      expression: `${sourceName}.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))`,
      value: alive.map((enemy) => ({ name: enemy.name, 'stats.hp': enemy.hp })),
    })
  }

  if (code.includes('const scored')) {
    values.push({
      name: 'scored',
      expression: 'alive.map(enemy => ({ enemy, score: enemy.attackDamage }))',
      value: alive.map((enemy) => ({ name: enemy.name, score: enemy.attackDamage })),
    })
  }

  if (code.includes('const hasWounded')) {
    values.push({
      name: 'hasWounded',
      expression: 'alive.some(enemy => enemy.hp < 50)',
      value: alive.some((enemy) => enemy.hp < 50),
    })
  }

  if (code.includes('const allStable')) {
    values.push({
      name: 'allStable',
      expression: 'alive.every(enemy => enemy.hp >= 50)',
      value: alive.every((enemy) => enemy.hp >= 50),
    })
  }

  if (code.includes('const limit: Limit = 60')) {
    values.push({ name: 'limit', expression: 'const limit: Limit = 60', value: 60 })
  }

  if (code.includes('const scan: Scan = { limit: 75 }')) {
    values.push({ name: 'scan.limit', expression: 'scan.limit', value: 75 })
    values.push({ name: 'limit', expression: 'const limit = scan.limit', value: 75 })
  }

  if (code.includes('const candidates: Candidate[]')) {
    const candidates = alive.map((enemy) => ({ name: enemy.name, score: enemy.attackDamage }))
    values.push({
      name: 'candidates',
      expression: '生存Enemyをscore付きCandidateへ変換',
      value: candidates,
    })
    values.push({
      name: 'ready',
      expression: 'candidates.filter(item => item.score !== undefined)',
      value: candidates,
    })
  }

  if (code.includes('const candidates: Scored<Enemy>[]')) {
    const candidates = alive.map((enemy) => ({ name: enemy.name, score: enemy.attackDamage }))
    values.push({
      name: 'candidates',
      expression: '生存EnemyをScored<Enemy>へ変換',
      value: candidates,
    })
    values.push({
      name: 'ready',
      expression: 'candidates.filter(candidate => candidate.score !== undefined)',
      value: candidates,
    })
  }

  if (code.includes('const key = "hp"')) {
    values.push({ name: 'key', expression: '"hp"', value: 'hp' })
  }

  return values
}
