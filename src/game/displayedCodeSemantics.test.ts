import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { allSkillDefinitions, getSkillCardForBattle } from './skills'
import { getTargets } from './targeting'
import type { Enemy } from './types'

const enemy = (id: string, name: string, hp: number, attackDamage: number): Enemy => ({
  id,
  name,
  hp,
  maxHp: Math.max(hp, 100),
  attackName: 'Test Attack',
  attackDamage,
  glyph: '•',
})

const board = [
  enemy('dead', 'Goblin', 0, 99),
  enemy('sprout', 'Sprout', 30, 5),
  enemy('goblin-low', 'Goblin', 54, 15),
  enemy('goblin-high', 'Goblin', 90, 8),
  enemy('guardian', 'Guardian', 130, 20),
]

type SemanticFixture = {
  targetIds: readonly string[]
  power: number
  baseCodeFingerprint: string
}

const fingerprint = (value: string) => {
  let fnv = 2166136261
  let djb = 5381
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    fnv = Math.imul(fnv ^ codePoint, 16777619)
    djb = Math.imul(djb, 33) ^ codePoint
  }
  return `${(fnv >>> 0).toString(16).padStart(8, '0')}${(djb >>> 0)
    .toString(16)
    .padStart(8, '0')}`
}

const definitionFingerprint = (definition: (typeof allSkillDefinitions)[number]) =>
  fingerprint(
    definition.codeVariants.map((variant) => `${variant.id}\u0000${variant.code}`).join('\u0001'),
  )

/**
 * Review-owned oracle for base displayed-code meaning. The exact fingerprint covers every variant
 * ID, operator, operand order, property access and line. Targets and POWER are independently
 * reviewed expectations; none are derived from the production TargetRule implementation.
 */
const fixtures: Record<string, SemanticFixture> = {
  trace: {
    targetIds: ['sprout'],
    power: 34,
    baseCodeFingerprint: '2fd6451c1524e382',
  },
  pulse: {
    targetIds: ['goblin-low'],
    power: 48,
    baseCodeFingerprint: '0ce45f7c1b93ea9c',
  },
  nova: {
    targetIds: ['goblin-high'],
    power: 62,
    baseCodeFingerprint: '33f87017cb0445c7',
  },
  viper: {
    targetIds: ['sprout', 'goblin-low'],
    power: 22,
    baseCodeFingerprint: 'ba6f28f2df5ceea6',
  },
  lock: {
    targetIds: ['goblin-low', 'goblin-high'],
    power: 24,
    baseCodeFingerprint: '819515c98a6a16b9',
  },
  alert: {
    targetIds: ['goblin-low'],
    power: 40,
    baseCodeFingerprint: '4db2dd04a84d8520',
  },
  echo: {
    targetIds: ['goblin-high', 'guardian'],
    power: 26,
    baseCodeFingerprint: '338f6df3609737c7',
  },
  'moon-edge': {
    targetIds: ['sprout'],
    power: 72,
    baseCodeFingerprint: 'daddaeeede648196',
  },
  sweep: {
    targetIds: ['sprout', 'goblin-low', 'goblin-high', 'guardian'],
    power: 18,
    baseCodeFingerprint: 'bfa5241e57cb5fde',
  },
  judge: {
    targetIds: ['guardian'],
    power: 52,
    baseCodeFingerprint: '723d1af58514b227',
  },
  link: {
    targetIds: ['goblin-low'],
    power: 44,
    baseCodeFingerprint: 'f66af457e30f9cd3',
  },
  fork: {
    targetIds: ['sprout'],
    power: 46,
    baseCodeFingerprint: '88c11dcb2da610d1',
  },
  gather: {
    targetIds: ['sprout'],
    power: 22,
    baseCodeFingerprint: '6d8c91eddb3f4eb1',
  },
  project: {
    targetIds: ['sprout'],
    power: 40,
    baseCodeFingerprint: '72e42e6a2fa398c4',
  },
  signal: {
    targetIds: ['sprout', 'goblin-low', 'goblin-high', 'guardian'],
    power: 20,
    baseCodeFingerprint: 'f84d93493ed8b049',
  },
  sync: {
    targetIds: [],
    power: 22,
    baseCodeFingerprint: '4c333ad98a8b5a2b',
  },
  order: {
    targetIds: ['sprout'],
    power: 58,
    baseCodeFingerprint: 'e86750efa6791cbd',
  },
  'safe-path': {
    targetIds: ['sprout'],
    power: 60,
    baseCodeFingerprint: '51d16b57205ce3fd',
  },
  'reduce-focus': {
    targetIds: ['guardian'],
    power: 54,
    baseCodeFingerprint: '40fbb334950fba40',
  },
  'ts-scan': {
    targetIds: ['sprout'],
    power: 38,
    baseCodeFingerprint: 'fa2859f8d4c3bce8',
  },
  'ts-guard': {
    targetIds: ['goblin-high', 'guardian'],
    power: 24,
    baseCodeFingerprint: 'a7f78e21ccb409a3',
  },
  'ts-label': {
    targetIds: ['goblin-low'],
    power: 48,
    baseCodeFingerprint: '453f23cb0c9cf2f7',
  },
  'ts-union': {
    targetIds: ['sprout', 'goblin-low'],
    power: 28,
    baseCodeFingerprint: 'caf7143c33293524',
  },
  'ts-optional': {
    targetIds: ['sprout'],
    power: 42,
    baseCodeFingerprint: '4d2f335cb646a5a4',
  },
  'ts-narrow': {
    targetIds: ['guardian'],
    power: 54,
    baseCodeFingerprint: 'f4cb5b9ea6243be4',
  },
  'ts-keyof': {
    targetIds: ['sprout'],
    power: 70,
    baseCodeFingerprint: 'ab2c53e17deef6ff',
  },
}

type GeneratedCodeFixture = {
  skillId: string
  battleId: number
  seed: string
  lineMode?: 'single' | 'multi'
  code: string
}

/** Exact, human-readable outputs from the production display path, including each transform. */
const generatedCodeFixtures: readonly GeneratedCodeFixture[] = [
  { skillId: 'trace', battleId: 1, seed: 'oracle-0', code: 'enemies.find(e => e.hp < 45)' },
  {
    skillId: 'trace',
    battleId: 1,
    seed: 'oracle-1',
    code: 'enemies.find((enemy) => 45 > enemy.hp)',
  },
  { skillId: 'trace', battleId: 1, seed: 'oracle-2', code: 'enemies.find(e => e["hp"] < 45)' },
  {
    skillId: 'trace',
    battleId: 1,
    seed: 'oracle-3',
    code: 'enemies.find((target) => 45 > target["hp"])',
  },
  {
    skillId: 'safe-path',
    battleId: 21,
    seed: 'oracle-0',
    lineMode: 'multi',
    code: 'const living = enemies.filter(enemy => 0 < enemy["hp"])\nconst wrapped = living.map(enemy => ({ enemy, stats: { hp: enemy["hp"] } }))\nwrapped.sort((left, right) => (left["stats"]?.["hp"] ?? Infinity) - (right["stats"]?.["hp"] ?? Infinity))[0]["enemy"]',
  },
  {
    skillId: 'safe-path',
    battleId: 21,
    seed: 'oracle-2',
    lineMode: 'multi',
    code: 'const living = enemies.filter(enemy => enemy.hp > 0)\nconst wrapped = living.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))\nwrapped.sort((left, right) => (left.stats?.hp ?? Infinity) - (right.stats?.hp ?? Infinity))[0].enemy',
  },
  {
    skillId: 'safe-path',
    battleId: 21,
    seed: 'oracle-3',
    lineMode: 'multi',
    code: 'const living = enemies.filter((e) => e.hp > 0)\nconst wrapped = living.map((e) => ({ enemy: e, stats: { hp: e.hp } }))\nwrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy',
  },
  {
    skillId: 'ts-scan',
    battleId: 4,
    seed: 'oracle-0',
    code: 'enemies.find((target: Enemy): boolean => 55 > target["hp"])',
  },
  {
    skillId: 'ts-scan',
    battleId: 4,
    seed: 'oracle-7',
    code: 'enemies.find((enemy: Enemy): boolean => enemy.hp < 55)',
  },
  {
    skillId: 'ts-scan',
    battleId: 4,
    seed: 'oracle-11',
    code: 'enemies.find((enemy: Enemy): boolean => enemy["hp"] < 55)',
  },
]

type GeneratedSetFixture = {
  count: number
  fingerprint: string
}

/**
 * Review-owned fingerprints for every generated semantic candidate that can reach the UI.
 * Keys cover every registered Skill in the line mode in which its Battle renders it.
 */
const generatedSetFixtures: Record<string, GeneratedSetFixture> = {
  'trace/single': { count: 24, fingerprint: '7af90b861d2b96c4' },
  'pulse/single': { count: 24, fingerprint: 'f794a00abebf2304' },
  'nova/single': { count: 24, fingerprint: '99d1b37e00351484' },
  'viper/single': { count: 24, fingerprint: '1f48dd2a0ee81b84' },
  'lock/single': { count: 24, fingerprint: '5acd7b3a4f759584' },
  'alert/single': { count: 24, fingerprint: '8a1678320e01cdc4' },
  'echo/single': { count: 24, fingerprint: '8e9cd5bafb1dfec4' },
  'moon-edge/multi': { count: 24, fingerprint: 'f189a85e646700c4' },
  'sweep/multi': { count: 18, fingerprint: 'e6567ac62eee8d84' },
  'judge/multi': { count: 16, fingerprint: '6c8385161f848684' },
  'link/single': { count: 32, fingerprint: 'c54558a6d2ffd0c4' },
  'fork/single': { count: 32, fingerprint: '73a915a2a6bdf384' },
  'gather/single': { count: 32, fingerprint: '5e4ead96fe979644' },
  'project/single': { count: 24, fingerprint: '2ec4a7023184ae44' },
  'signal/single': { count: 24, fingerprint: '03d6d9564695e244' },
  'sync/single': { count: 24, fingerprint: '19d941222b0d5844' },
  'order/multi': { count: 16, fingerprint: '38cd825a77509384' },
  'safe-path/multi': { count: 16, fingerprint: '582fca56cc411c84' },
  'reduce-focus/multi': { count: 16, fingerprint: '558ab272c83e2f44' },
  'ts-scan/single': { count: 12, fingerprint: 'cca4a1ea31a31d04' },
  'ts-guard/single': { count: 12, fingerprint: '052359e4156f17e4' },
  'ts-label/single': { count: 12, fingerprint: '7e92879e69cfe7c4' },
  'ts-union/multi': { count: 8, fingerprint: '3acfb116447dd104' },
  'ts-optional/multi': { count: 8, fingerprint: 'fe9c61e6cfd93904' },
  'ts-narrow/multi': { count: 24, fingerprint: '8cb4fd96bd60ab04' },
  'ts-keyof/multi': { count: 20, fingerprint: 'a4f18c1239a125c4' },
}

describe('displayed code target/effect independent oracle', () => {
  it('全registered Skillにreview-owned fixtureがある', () => {
    expect(Object.keys(fixtures).sort()).toEqual(
      allSkillDefinitions.map((definition) => definition.id).sort(),
    )
  })

  it.each(allSkillDefinitions)(
    '$idの全base variant・runtime target・effectがreview-owned fixtureと一致する',
    (definition) => {
      const fixture = fixtures[definition.id]
      expect(fixture, `${definition.id} needs an independent semantic fixture`).toBeDefined()
      expect(definitionFingerprint(definition)).toBe(fixture?.baseCodeFingerprint)
      expect(definition.power).toBe(fixture?.power)
      expect(getTargets(board, definition.rule).map((target) => target.id)).toEqual(
        fixture?.targetIds,
      )
    },
  )

  it.each(generatedCodeFixtures)(
    '$skillId/$seedのsemantic transform後表示codeが厳密fixtureと一致する',
    ({ skillId, battleId, seed, lineMode = 'single', code }) => {
      expect(getSkillCardForBattle(skillId, battleId, seed, lineMode).code).toBe(code)
    },
  )

  it('全Skill・実表示line modeの全semantic transform候補を厳密fixtureで固定する', () => {
    const actualKeys: string[] = []

    for (const definition of allSkillDefinitions) {
      for (const lineMode of ['single', 'multi'] as const) {
        const battle = battles.find(
          (candidate) =>
            candidate.skillIds.includes(definition.id) &&
            (candidate.multiLineSkillIds?.includes(definition.id) ?? false) ===
              (lineMode === 'multi'),
        )
        if (!battle) continue

        const key = `${definition.id}/${lineMode}`
        actualKeys.push(key)
        const fixture = generatedSetFixtures[key]
        expect(fixture, `${key} needs a generated-code fixture`).toBeDefined()

        const collect = (limit: number) =>
          new Set(
            Array.from({ length: limit }, (_, ordinal) =>
              getSkillCardForBattle(
                definition.id,
                battle.id,
                `encounter:${ordinal}:oracle:fixture`,
                lineMode,
              ).code,
            ),
          )
        const firstPass = collect(128)
        const exhaustivePass = collect(256)

        expect(firstPass).toEqual(exhaustivePass)
        const codes = [...exhaustivePass].sort()
        expect(codes).toHaveLength(fixture?.count ?? -1)
        expect(fingerprint(codes.join('\u0001'))).toBe(fixture?.fingerprint)
      }
    }

    expect(actualKeys.sort()).toEqual(Object.keys(generatedSetFixtures).sort())
  })
})
