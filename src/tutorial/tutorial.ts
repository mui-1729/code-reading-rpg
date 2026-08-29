export const TUTORIAL_SCHEMA_VERSION = 1

export type TutorialStatus = 'active' | 'completed' | 'skipped'
export type TutorialPhase = 'field-move' | 'field-interact' | 'party-join' | 'battle'

export type TutorialState = {
  version: typeof TUTORIAL_SCHEMA_VERSION
  status: TutorialStatus
  phase: TutorialPhase
}

export function createInitialTutorialState(): TutorialState {
  return {
    version: TUTORIAL_SCHEMA_VERSION,
    status: 'active',
    phase: 'field-move',
  }
}

export function completeFieldMove(state: TutorialState): TutorialState {
  if (state.status !== 'active' || state.phase !== 'field-move') return state
  return { ...state, phase: 'field-interact' }
}

export function completeFieldInteraction(state: TutorialState): TutorialState {
  if (state.status !== 'active' || state.phase !== 'field-interact') return state
  return { ...state, phase: 'party-join' }
}

export function enterBattleTutorial(state: TutorialState): TutorialState {
  if (state.status !== 'active' || state.phase === 'battle') return state
  return { ...state, phase: 'battle' }
}

export function completeBattleTutorial(state: TutorialState): TutorialState {
  if (state.status !== 'active' || state.phase !== 'battle') return state
  return { ...state, status: 'completed' }
}

export function skipTutorial(state: TutorialState): TutorialState {
  if (state.status !== 'active') return state
  return { ...state, status: 'skipped' }
}
