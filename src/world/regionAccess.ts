import type { PlayerProgress } from '../progression'
import { OVERWORLD_MAP_ID, type WorldMapId } from './worldMap'

export const TYPESCRIPT_REGION_MIN_X = 23

export function isTypeScriptRegionUnlocked(
  progress: Pick<PlayerProgress, 'clearedStageIds'>,
): boolean {
  return progress.clearedStageIds.includes(3)
}

export function shouldBlockTypeScriptRegionMove(
  mapId: WorldMapId,
  currentX: number,
  nextX: number,
  progress: Pick<PlayerProgress, 'clearedStageIds'>,
): boolean {
  if (mapId !== OVERWORLD_MAP_ID || isTypeScriptRegionUnlocked(progress)) return false
  return currentX < TYPESCRIPT_REGION_MIN_X && nextX >= TYPESCRIPT_REGION_MIN_X
}
