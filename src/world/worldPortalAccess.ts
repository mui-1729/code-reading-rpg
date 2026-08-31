import { areBattlePrerequisitesMet } from '../progression/progressionGraph'

/** Movement and save restoration must agree on the full prerequisite chain. */
export function isWorldPortalRequirementSatisfied(
  requiredClearedStageId: number | undefined,
  clearedStageIds: readonly number[],
): boolean {
  if (requiredClearedStageId === undefined) return true
  return (
    clearedStageIds.includes(requiredClearedStageId) &&
    areBattlePrerequisitesMet(requiredClearedStageId, clearedStageIds)
  )
}
