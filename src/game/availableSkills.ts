import {
  getBattleStartMasteredSkillIds,
  getBattleTrialSkillIds,
} from '../progression/skillMastery'
import type { Seed } from './random'
import { getSkillCardsForBattle as getAuthoredSkillCardsForBattle } from './skills'
import type { Battle, SkillCard } from './types'

export type BattleSkillAvailability = {
  masteredSkillIds: string[]
  trialSkillIds: string[]
  availableSkillIds: string[]
}

export function getBattleSkillAvailability(
  stageId: number,
  masteredSkillIds: readonly string[] = getBattleStartMasteredSkillIds(stageId),
): BattleSkillAvailability {
  const normalizedMasteredSkillIds = [...new Set(masteredSkillIds)]
  const trialSkillIds = getBattleTrialSkillIds(stageId)
  const availableSkillIds = [...new Set([...normalizedMasteredSkillIds, ...trialSkillIds])]

  return {
    masteredSkillIds: normalizedMasteredSkillIds,
    trialSkillIds,
    availableSkillIds,
  }
}

export function getAvailableSkillCardsForBattle(
  battle: Battle,
  seed: Seed,
  masteredSkillIds?: readonly string[],
): SkillCard[] {
  const authoredCards = getAuthoredSkillCardsForBattle(battle, seed)
  const availableIds = new Set(
    getBattleSkillAvailability(battle.id, masteredSkillIds).availableSkillIds,
  )

  return authoredCards.filter((skill) => availableIds.has(skill.id))
}

export function getUnavailableAuthoredSkillIds(battle: Battle): string[] {
  const availableIds = new Set(getBattleSkillAvailability(battle.id).availableSkillIds)
  return battle.skillIds.filter((skillId) => !availableIds.has(skillId))
}
