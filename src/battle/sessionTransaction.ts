import type { PlayerProgress } from '../progression/types'
import type { RpgState } from '../rpg/state'

export type BattleSessionIdentity = {
  id: string
  areaId: string
  battleId: number
  seed: string
  returnTo?: string
}

export type BattlePersistentState = { progress: PlayerProgress; rpgState: RpgState }

/** Only the immutable attempt-start state is persisted, never half a combat turn. */
export type BattleSessionSnapshot = BattlePersistentState & { identity: BattleSessionIdentity }
export type BattleTransactionState = BattlePersistentState & { battleSession?: BattleSessionSnapshot }
export type BattleCommitEvent = 'VICTORY'
export type BattleRollbackMode = 'retry' | 'checkpoint' | 'abort' | 'reload'
export type BattleStateAction = (current: BattlePersistentState) => BattlePersistentState

// World encounter rolls begin once the counter reaches the encounter threshold.
// Returning from a failed attempt starts a fresh safe window instead of immediately
// throwing the player back into another random encounter.
export const BATTLE_RETURN_ENCOUNTER_COOLDOWN = 0

/** A passive tab must not calculate World actions from another tab's tentative HP/items. */
export function getVisibleBattleState(state: BattleTransactionState, localAttemptId: string | null): BattlePersistentState {
  return state.battleSession && state.battleSession.identity.id !== localAttemptId
    ? state.battleSession : state
}

export function rollbackBattleSession<T extends BattleTransactionState>(
  state: T,
  id?: string,
  mode: BattleRollbackMode = 'abort',
): T {
  if (!state.battleSession || (id !== undefined && state.battleSession.identity.id !== id)) return state
  const rpgState = mode === 'checkpoint'
    ? { ...state.battleSession.rpgState, stepsSinceEncounter: BATTLE_RETURN_ENCOUNTER_COOLDOWN }
    : state.battleSession.rpgState
  return {
    ...state,
    progress: state.battleSession.progress,
    rpgState,
    battleSession: undefined,
  }
}

export function startBattleSession<T extends BattleTransactionState>(state: T, identity: BattleSessionIdentity): T {
  if (state.battleSession?.identity.id === identity.id) return state
  // Entering another Battle aborts an unfinished attempt before taking its snapshot.
  const start = rollbackBattleSession(state)
  return {
    ...start,
    battleSession: { identity, progress: start.progress, rpgState: start.rpgState },
  }
}

export function updateBattleSession<T extends BattleTransactionState>(state: T, id: string, action: BattleStateAction): T {
  if (state.battleSession?.identity.id !== id) return state
  return { ...state, ...action(state) }
}

export function commitBattleSession<T extends BattleTransactionState>(
  state: T,
  id: string,
  event: BattleCommitEvent,
  action: BattleStateAction = (current) => current,
): T {
  if (state.battleSession?.identity.id !== id) return state
  if (event !== 'VICTORY') return state
  return { ...state, ...action(state), battleSession: undefined }
}
