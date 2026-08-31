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
export type BattleCommitEvent = 'VICTORY' | 'DEFEAT' | 'RUN'
export type BattleStateAction = (current: BattlePersistentState) => BattlePersistentState

/** A passive tab must not calculate World actions from another tab's tentative HP/items. */
export function getVisibleBattleState(state: BattleTransactionState, localAttemptId: string | null): BattlePersistentState {
  return state.battleSession && state.battleSession.identity.id !== localAttemptId
    ? state.battleSession : state
}

export function rollbackBattleSession<T extends BattleTransactionState>(state: T, id?: string): T {
  if (!state.battleSession || (id !== undefined && state.battleSession.identity.id !== id)) return state
  return {
    ...state,
    progress: state.battleSession.progress,
    rpgState: state.battleSession.rpgState,
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
  // The caller supplies the current defeat recovery policy; Retry UX belongs elsewhere.
  switch (event) {
    case 'VICTORY':
    case 'DEFEAT':
    case 'RUN':
      return { ...state, ...action(state), battleSession: undefined }
  }
}
