import {
  getProgressionNode,
  isBattleAccessible,
  type PlayerProgress,
} from '../progression'
import { getAreaDefinition, type AreaId } from './areas'

export type BattleRouteArea = AreaId

type ProgressSlice = Pick<PlayerProgress, 'clearedStageIds' | 'unlockedStageIds'>

export function isBattleRouteUnlocked(
  area: BattleRouteArea,
  battleId: number,
  progress: ProgressSlice,
): boolean {
  const definition = getAreaDefinition(area)
  if (!definition?.battleIds.some((id) => id === battleId)) return false
  const node = getProgressionNode(battleId)
  if (!node || node.area !== area) return false

  // unlockedStageIds is presentation/cache state only. Canonical prerequisites are the authority.
  return isBattleAccessible(battleId, progress.clearedStageIds)
}

export function getBattleRouteLockReason(area: BattleRouteArea, battleId: number): string {
  const definition = getAreaDefinition(area)
  if (!definition?.battleIds.some((id) => id === battleId)) {
    return 'このBattleは存在しない。Worldへ戻ろう。'
  }
  const node = getProgressionNode(battleId)
  if (!node || node.area !== area) return 'このBattleは存在しない。Worldへ戻ろう。'

  if (area === 'typescript') {
    return 'JavaScript地方のFinal Bossと、TypeScript地方の前のStory beatを先に完了しよう。'
  }

  if (battleId === 1) {
    return '最初のlive incidentはWorldでBYTEと合流し、西の草原へ進むと始まる。'
  }
  if (battleId === 7 || battleId === 8 || battleId === 9) {
    return 'まず草原で最初のtarget異常を実際に見てから、Villageで読めなかった部分を確認しよう。'
  }
  if (battleId === 2) {
    return '最初のincidentを観察してVillageで基礎を確認し、Forestで影響範囲のtraceまで追ってDeep Forest入口へ進もう。'
  }
  if (battleId === 3) {
    return '二つのincidentを確認し、Deep Forestのtraceを最後までroot causeへ追おう。'
  }
  return 'このStory beatはまだ解放されていない。WorldのNEXT OBJECTIVEから順に進もう。'
}
