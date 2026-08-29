import type { PlayerProgress } from '../progression'

export type BattleRouteArea = 'javascript' | 'typescript'

type ProgressSlice = Pick<PlayerProgress, 'clearedStageIds' | 'unlockedStageIds'>

const JAVASCRIPT_BATTLE_IDS = new Set([1, 2, 3, ...Array.from({ length: 16 }, (_, index) => index + 7)])
const TYPESCRIPT_BATTLE_IDS = new Set([4, 5, 6])

const isCleared = (progress: ProgressSlice, battleId: number) =>
  progress.clearedStageIds.includes(battleId)

function isDerivedUnlock(area: BattleRouteArea, battleId: number, progress: ProgressSlice) {
  if (area === 'typescript') {
    if (!isCleared(progress, 3)) return false
    if (battleId === 4) return false
    if (battleId === 5) return isCleared(progress, 4)
    if (battleId === 6) return isCleared(progress, 5)
    return false
  }

  if (battleId === 2) return isCleared(progress, 1)
  if (battleId === 3) return [22, 1, 2].every((id) => isCleared(progress, id))
  if (battleId >= 8 && battleId <= 22) return isCleared(progress, battleId - 1)
  return false
}

export function isBattleRouteUnlocked(
  area: BattleRouteArea,
  battleId: number,
  progress: ProgressSlice,
): boolean {
  const known =
    area === 'javascript'
      ? JAVASCRIPT_BATTLE_IDS.has(battleId)
      : TYPESCRIPT_BATTLE_IDS.has(battleId)
  if (!known) return false
  if (isCleared(progress, battleId)) return true

  if (area === 'typescript' && !isCleared(progress, 3)) return false

  return progress.unlockedStageIds.includes(battleId) || isDerivedUnlock(area, battleId, progress)
}

export function getBattleRouteLockReason(area: BattleRouteArea, battleId: number): string {
  if (area === 'typescript' && !Number.isNaN(battleId)) {
    return 'JavaScript地方のFinal Bossと、TypeScript地方の前のBattleを先に完了しよう。'
  }

  if (battleId === 3) return 'JavaScript地方のBattle 1 / 2を先に完了しよう。'
  return 'このBattleはまだ解放されていない。WorldのNEXT OBJECTIVEから順に進もう。'
}
