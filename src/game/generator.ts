import { battles } from './battles'
import { createSeededRandom, type Seed, type SeededRandom } from './random'
import { skills } from './skills'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'
import { getTargets } from './targeting'
import type { Battle } from './types'

const HP_MULTIPLIER_MIN_PERCENT = 85
const HP_MULTIPLIER_MAX_PERCENT = 115
const MAX_GENERATION_ATTEMPTS = 32

export function generateBattle(battleId: number, seed: Seed): Battle | undefined {
  const template = battles.find((battle) => battle.id === battleId)
  if (!template) return undefined

  const random = createSeededRandom(`${String(seed)}:battle:${template.id}`)

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = createCandidate(template, random)
    if (isValidCandidate(template, candidate)) return candidate
  }

  return cloneBattle(template)
}

function createCandidate(template: Battle, random: SeededRandom): Battle {
  const enemies = template.enemies.map((enemy) => {
    const multiplier =
      random.int(HP_MULTIPLIER_MIN_PERCENT, HP_MULTIPLIER_MAX_PERCENT) / 100
    const hp = Math.max(1, Math.round(enemy.maxHp * multiplier))

    return { ...enemy, hp, maxHp: hp }
  })

  return {
    ...template,
    enemies: random.shuffle(enemies),
    skillIds: random.shuffle(template.skillIds),
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
