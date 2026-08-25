import { battles } from './battles'
import { createSeededRandom, type Seed } from './random'
import type { Battle } from './types'

type HpRange = readonly [min: number, max: number]

type BattleGenerationRules = {
  hpByEnemyId: Record<string, HpRange>
}

const generationRules: Record<number, BattleGenerationRules> = {
  1: {
    hpByEnemyId: {
      'slime-a': [30, 40],
      'goblin-a': [66, 78],
    },
  },
  2: {
    hpByEnemyId: {
      'slime-b': [36, 44],
      'goblin-b': [64, 76],
      'golem-b': [116, 132],
    },
  },
  3: {
    hpByEnemyId: {
      'slime-c': [46, 54],
      'goblin-c': [78, 92],
      'boss-c': [148, 166],
    },
  },
}

export function generateBattle(battleId: number, seed: Seed): Battle | undefined {
  const template = battles.find((battle) => battle.id === battleId)
  if (!template) return undefined

  const rules = generationRules[template.id]
  if (!rules) return cloneBattle(template)

  const random = createSeededRandom(`${String(seed)}:battle:${template.id}`)
  const enemies = template.enemies.map((enemy) => {
    const range = rules.hpByEnemyId[enemy.id]
    const hp = range ? random.int(range[0], range[1]) : enemy.hp

    return { ...enemy, hp, maxHp: hp }
  })

  return {
    ...template,
    enemies: random.shuffle(enemies),
    skillIds: random.shuffle(template.skillIds),
  }
}

function cloneBattle(battle: Battle): Battle {
  return {
    ...battle,
    enemies: battle.enemies.map((enemy) => ({ ...enemy })),
    skillIds: [...battle.skillIds],
  }
}
