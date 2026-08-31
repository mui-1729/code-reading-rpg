import { getPlayerStats } from '../progression/progression'
import type { PlayerProgress } from '../progression/types'
import { getCombatStats } from '../rpg/combat'
import type { RpgState } from '../rpg/state'
import { normalizeRpgStateForProgress, type GameStateSnapshot } from './gameStateStorage'

export type GameStateStoreState = GameStateSnapshot & { dirty: boolean }
type StateAction<T> = T | ((current: T) => T)

function normalizeRpgState(progress: PlayerProgress, rpgState: RpgState): RpgState {
  const stats = getPlayerStats(progress.exp)
  const maxHp = getCombatStats(stats, rpgState).maxHp
  const currentHp = Math.max(0, Math.min(maxHp, rpgState.currentHp))
  const normalized = currentHp === rpgState.currentHp ? rpgState : { ...rpgState, currentHp }
  return normalizeRpgStateForProgress(progress, normalized)
}

export function updateGameProgress(
  current: GameStateStoreState,
  action: StateAction<PlayerProgress>,
): GameStateStoreState {
  const progress = typeof action === 'function' ? action(current.progress) : action
  if (Object.is(progress, current.progress)) return current
  return {
    ...current,
    progress,
    rpgState: normalizeRpgState(progress, current.rpgState),
    dirty: true,
  }
}

export function updateGameRpgState(
  current: GameStateStoreState,
  action: StateAction<RpgState>,
): GameStateStoreState {
  const rpgState = typeof action === 'function' ? action(current.rpgState) : action
  if (Object.is(rpgState, current.rpgState)) return current
  return {
    ...current,
    rpgState: normalizeRpgState(current.progress, rpgState),
    dirty: true,
  }
}
