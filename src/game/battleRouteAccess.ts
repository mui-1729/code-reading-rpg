import type { PlayerProgress } from '../progression'

export type BattleRouteArea = 'javascript' | 'typescript'

type ProgressSlice = Pick<PlayerProgress, 'clearedStageIds' | 'unlockedStageIds'>

const JAVASCRIPT_BATTLE_IDS = new Set([1, 2, 3, ...Array.from({ length: 16 }, (_, index) => index + 7)])
const TYPESCRIPT_BATTLE_IDS = new Set([4, 5, 6])

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
  if (progress.clearedStageIds.includes(battleId)) return true

  if (area === 'typescript' && !progress.clearedStageIds.includes(3)) return false

  return progress.unlockedStageIds.includes(battleId)
}

export function getBattleRouteLockReason(area: BattleRouteArea, battleId: number): string {
  if (area === 'typescript' && !Number.isNaN(battleId)) {
    return 'JavaScript地方のFinal Bossと、TypeScript地方の前のBattleを先に完了しよう。'
  }

  if (battleId === 3) return 'JavaScript地方のBattle 1 / 2を先に完了しよう。'
  return 'このBattleはまだ解放されていない。WorldのNEXT OBJECTIVEから順に進もう。'
}
