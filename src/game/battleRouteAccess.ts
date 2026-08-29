import type { PlayerProgress } from '../progression'

export type BattleRouteArea = 'javascript' | 'typescript'

type ProgressSlice = Pick<PlayerProgress, 'clearedStageIds'>

const javascriptPrerequisite: Record<number, readonly number[]> = {
  7: [],
  8: [7],
  9: [8],
  10: [9],
  11: [10],
  12: [11],
  13: [12],
  14: [13],
  15: [14],
  16: [15],
  17: [16],
  18: [17],
  19: [18],
  20: [19],
  21: [20],
  22: [21],
  1: [22],
  2: [1],
  3: [2, 22],
}

const typescriptPrerequisite: Record<number, readonly number[]> = {
  4: [3],
  5: [3, 4],
  6: [3, 5],
}

export function isBattleRouteUnlocked(
  area: BattleRouteArea,
  battleId: number,
  progress: ProgressSlice,
): boolean {
  if (progress.clearedStageIds.includes(battleId)) return true

  const prerequisite =
    area === 'javascript'
      ? javascriptPrerequisite[battleId]
      : typescriptPrerequisite[battleId]

  if (!prerequisite) return false
  return prerequisite.every((stageId) => progress.clearedStageIds.includes(stageId))
}

export function getBattleRouteLockReason(area: BattleRouteArea, battleId: number): string {
  if (area === 'typescript') {
    return battleId === 4
      ? 'JavaScript地方のFinal Bossを先に倒そう。'
      : 'TypeScript地方の前のBattleを先に完了しよう。'
  }

  if (battleId === 3) return 'JavaScript地方のLessonとBattle 1 / 2を先に完了しよう。'
  if (battleId === 1 || battleId === 2) return 'JavaScriptの学習routeをDeep Forestまで完了しよう。'
  return 'JavaScript地方の前のLessonを先に完了しよう。'
}
