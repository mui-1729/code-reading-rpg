import {
  getProgressionNode,
  isBattleAccessible,
  type PlayerProgress,
  type ProgressionArea,
} from '../progression'

export type BattleRouteArea = ProgressionArea

type ProgressSlice = Pick<PlayerProgress, 'clearedStageIds' | 'unlockedStageIds'>

export function isBattleRouteUnlocked(
  area: BattleRouteArea,
  battleId: number,
  progress: ProgressSlice,
): boolean {
  const node = getProgressionNode(battleId)
  if (!node || node.area !== area) return false

  // unlockedStageIds is presentation/cache state only. Canonical prerequisites are the authority.
  return isBattleAccessible(battleId, progress.clearedStageIds)
}

export function getBattleRouteLockReason(area: BattleRouteArea, battleId: number): string {
  const node = getProgressionNode(battleId)
  if (!node || node.area !== area) return 'このBattleは存在しない。Worldへ戻ろう。'

  if (area === 'typescript') {
    return 'JavaScript地方のFinal Bossと、TypeScript地方の前のBattleを先に完了しよう。'
  }

  if (battleId === 1) return 'Deep Forestの学習Routeを最後まで進めてからIncident Battleへ向かおう。'
  if (battleId === 2) return 'Deep Forestの学習RouteとBattle 1を先に完了しよう。'
  if (battleId === 3) return 'Battle 22 / Battle 1 / Battle 2を先に完了しよう。'
  return 'このBattleはまだ解放されていない。WorldのNEXT OBJECTIVEから順に進もう。'
}
