import { battles } from './battles'
import { createSeededRandom, type Seed, type SeededRandom } from './random'
import { getSkillCardsForBattle } from './skills'
import { hasInitialValidTarget, isBattleSolvable } from './solvability'
import { getTargets } from './targeting'
import type { Battle, SkillCard } from './types'

const HP_MULTIPLIER_MIN_PERCENT = 85
const HP_MULTIPLIER_MAX_PERCENT = 115
const MAX_GENERATION_ATTEMPTS = 32

export function generateBattle(battleId: number, seed: Seed): Battle | undefined {
  const template = battles.find((battle) => battle.id === battleId)
  if (!template) return undefined

  const random = createSeededRandom(`${String(seed)}:battle:${template.id}`)
  const skillCards = getSkillCardsForBattle(template, seed)

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = createCandidate(template, random)
    if (isValidCandidate(template, candidate, skillCards)) return candidate
  }

  const fallback = cloneBattle(template)
  if (!isValidCandidate(template, fallback, skillCards)) {
    throw new Error(`Battle ${battleId} seed ${String(seed)} has no solvable semantic variant`)
  }
  return fallback
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

function isValidCandidate(
  template: Battle,
  candidate: Battle,
  skillCards: readonly SkillCard[],
): boolean {
  if (!hasInitialValidTarget(candidate, skillCards)) return false
  if (!preservesInitialLearningTargets(template, candidate, skillCards)) return false
  return isBattleSolvable(candidate, { skillCards })
}

function preservesInitialLearningTargets(
  template: Battle,
  candidate: Battle,
  skillCards: readonly SkillCard[],
): boolean {
  const skillById = new Map(skillCards.map((skill) => [skill.id, skill]))
  const requiredSkillIds = template.skillIds.filter((skillId) => {
    const skill = skillById.get(skillId)
    return skill ? getTargets(template.enemies, skill.rule).length > 0 : false
  })

  return requiredSkillIds.every((skillId) => {
    const skill = skillById.get(skillId)
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
