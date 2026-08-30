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

  if (battleId === 1) {
    return 'Villageのincident preparation（Battle 7〜9）を完了し、草原で最初の症状を再現しよう。'
  }
  if (battleId === 2) {
    return '最初のincidentからForestのtraceをBattle 14まで追い、Deep Forest入口へ進もう。'
  }
  if (battleId === 3) {
    return '二つのincidentを確認し、Deep ForestのtraceをBattle 22までroot causeへ追おう。'
  }
  return 'このBattleはまだ解放されていない。WorldのNEXT OBJECTIVEから順に進もう。'
}
