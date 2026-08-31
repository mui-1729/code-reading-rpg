import {
  areBattlePrerequisitesMet,
  getProgressionNode,
  getProgressionNodeByKey,
} from './progressionGraph'

export const INITIAL_MASTERED_SKILL_IDS = ['trace', 'pulse', 'nova'] as const

// Skills the player actually gets to try for the first time in a learning Battle.
// Keep this list narrow so a Lesson does not overload the player with every later
// combat variant that happens to reuse the same syntax.
const TRIAL_SKILLS_BY_STAGE_ID: Readonly<Record<number, readonly string[]>> = {
  10: ['link'],
  11: ['fork'],
  14: ['gather'],
  15: ['echo'],
  16: ['project'],
  17: ['signal'],
  18: ['sync'],
  20: ['order'],
  21: ['safe-path'],
  22: ['reduce-focus'],
  4: ['ts-scan', 'ts-guard', 'ts-label'],
  5: ['ts-union', 'ts-optional'],
  6: ['ts-narrow', 'ts-keyof'],
}

// Clearing a Lesson can also unlock later combat variants once every syntax
// used by that variant has already been learned. For example LOCK uses filter()
// as well as &&, so it waits until JS-09 rather than unlocking at JS-05.
const SKILL_UNLOCKS_BY_STAGE_ID: Readonly<Record<number, readonly string[]>> = {
  10: ['link'],
  11: ['fork'],
  14: ['gather', 'viper', 'lock', 'alert'],
  15: ['echo'],
  16: ['project'],
  17: ['signal', 'sweep'],
  18: ['sync'],
  20: ['order', 'moon-edge'],
  21: ['safe-path'],
  22: ['reduce-focus', 'judge'],
  4: ['ts-scan', 'ts-guard', 'ts-label'],
  5: ['ts-union', 'ts-optional'],
  6: ['ts-narrow', 'ts-keyof'],
}

export function getSkillUnlocksForStage(stageId: number): string[] {
  return [...(SKILL_UNLOCKS_BY_STAGE_ID[stageId] ?? [])]
}

export function getMasteredSkillIds(clearedStageIds: readonly number[]): string[] {
  const mastered = new Set<string>(INITIAL_MASTERED_SKILL_IDS)

  for (const stageId of clearedStageIds) {
    if (!areBattlePrerequisitesMet(stageId, clearedStageIds)) continue
    for (const skillId of getSkillUnlocksForStage(stageId)) mastered.add(skillId)
  }

  return [...mastered]
}

function collectPrerequisiteStageIds(stageId: number, collected: Set<number>): void {
  const node = getProgressionNode(stageId)
  if (!node) return

  for (const prerequisiteKey of node.prerequisites) {
    const prerequisiteNode = getProgressionNodeByKey(prerequisiteKey)
    if (!prerequisiteNode || collected.has(prerequisiteNode.battleId)) continue
    collected.add(prerequisiteNode.battleId)
    collectPrerequisiteStageIds(prerequisiteNode.battleId, collected)
  }
}

export function getBattleStartMasteredSkillIds(stageId: number): string[] {
  const prerequisiteIds = new Set<number>()
  collectPrerequisiteStageIds(stageId, prerequisiteIds)
  return getMasteredSkillIds([...prerequisiteIds])
}

export function getBattleTrialSkillIds(stageId: number): string[] {
  return [...(TRIAL_SKILLS_BY_STAGE_ID[stageId] ?? [])]
}

export function isSkillAvailableForBattle(stageId: number, skillId: string): boolean {
  return (
    getBattleStartMasteredSkillIds(stageId).includes(skillId) ||
    getBattleTrialSkillIds(stageId).includes(skillId)
  )
}
