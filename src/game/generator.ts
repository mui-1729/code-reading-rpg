import { battles } from './battles'
import { createSeededRandom, type Seed } from './random'
import { skills } from './skills'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'
import { getTargets } from './targeting'
import type { Battle, Enemy } from './types'

const BASE_HP_MULTIPLIER_PERCENT = 100
const HP_MULTIPLIER_STEP_PERCENT = 5

export function getHpMultiplierForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  return (
    BASE_HP_MULTIPLIER_PERCENT +
    (normalizedLevel - 1) * HP_MULTIPLIER_STEP_PERCENT
  ) / 100
}

export function getHpMultiplierSteps(level: number): number[] {
  const targetPercent = Math.round(getHpMultiplierForLevel(level) * 100)
  const steps: number[] = []

  for (
    let percent = targetPercent;
    percent >= BASE_HP_MULTIPLIER_PERCENT;
    percent -= HP_MULTIPLIER_STEP_PERCENT
  ) {
    steps.push(percent / 100)
  }

  return steps
}

export function generateBattle(
  battleId: number,
  seed: Seed,
  difficultyLevel: number = battleId,
): Battle | undefined {
  const template = battles.find((battle) => battle.id === battleId)
  if (!template) return undefined

  const normalizedLevel = Math.max(1, Math.floor(difficultyLevel))
  const random = createSeededRandom(
    `${String(seed)}:battle:${template.id}:level:${normalizedLevel}`,
  )
  const enemyOrder = random.shuffle(template.enemies.map((enemy) => ({ ...enemy })))
  const skillIds = random.shuffle(template.skillIds)

  for (const multiplier of getHpMultiplierSteps(normalizedLevel)) {
    const candidate = createCandidate(template, enemyOrder, skillIds, multiplier)
    if (isValidCandidate(template, candidate)) return candidate
  }

  return cloneBattle(template)
}

function createCandidate(
  template: Battle,
  enemyOrder: Enemy[],
  skillIds: string[],
  multiplier: number,
): Battle {
  const enemies = enemyOrder.map((enemy) => {
    const baseEnemy = template.enemies.find((candidate) => candidate.id === enemy.id)
    if (!baseEnemy) throw new Error(`Base enemy ${enemy.id} was not found`)

    const hp = Math.max(1, Math.round(baseEnemy.maxHp * multiplier))
    return { ...enemy, hp, maxHp: hp }
  })

  return {
    ...template,
    enemies,
    skillIds: [...skillIds],
  }
}

function isValidCandidate(template: Battle, candidate: Battle): boolean {
  if (!hasInitialValidTarget(candidate)) return false
  if (!preservesInitialLearningTargets(template, candidate)) return false
  return isBattleSolvable(candidate)
}

function preservesInitialLearningTargets(template: Battle, candidate: Battle): boolean {
  const requiredSkillIds = template.skillIds.filter((skillId) => {
    const skill = skills[skillId]
    return skill ? getTargets(template.enemies, skill.rule).length > 0 : false
  })

  return requiredSkillIds.every((skillId) => {
    const skill = skills[skillId]
    return skill ? getTargets(candidate.enemies, skill.rule).length > 0 : false
  })
}

function cloneBattle(battle: Battle): Battle {
  return {
    ...battle,
    enemies: battle.enemies.map((enemy) => ({ ...enemy })),
    skillIds: [...battle.skillIds],
  }
}
