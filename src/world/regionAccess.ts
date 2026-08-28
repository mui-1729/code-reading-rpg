import type { PlayerProgress } from '../progression'
import { OVERWORLD_MAP_ID, type WorldMapId } from './worldMap'

export const TYPESCRIPT_REGION_MIN_X = 23
export const TYPESCRIPT_GATE_X = TYPESCRIPT_REGION_MIN_X - 1

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

export function normalizeLockedTypeScriptPosition(
  mapId: WorldMapId,
  position: { x: number; y: number },
  progress: Pick<PlayerProgress, 'clearedStageIds'>,
): { x: number; y: number } {
  if (
    mapId !== OVERWORLD_MAP_ID ||
    isTypeScriptRegionUnlocked(progress) ||
    position.x < TYPESCRIPT_REGION_MIN_X
  ) {
    return position
  }

  return { x: TYPESCRIPT_GATE_X, y: position.y }
}
