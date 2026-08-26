import {
  createInitialTutorialState,
  TUTORIAL_SCHEMA_VERSION,
  type TutorialPhase,
  type TutorialState,
  type TutorialStatus,
} from './tutorial'

export const TUTORIAL_STORAGE_KEY = 'code-reading-rpg:tutorial'

const tutorialStatuses: TutorialStatus[] = ['active', 'completed', 'skipped']
const tutorialPhases: TutorialPhase[] = ['field-move', 'field-interact', 'battle']

const isTutorialStatus = (value: unknown): value is TutorialStatus =>
  typeof value === 'string' && tutorialStatuses.includes(value as TutorialStatus)

const isTutorialPhase = (value: unknown): value is TutorialPhase =>
  typeof value === 'string' && tutorialPhases.includes(value as TutorialPhase)

export function serializeTutorialState(state: TutorialState): string {
  return JSON.stringify(state)
}

export function restoreTutorialState(raw: string | null): TutorialState {
  if (raw === null) return createInitialTutorialState()

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return createInitialTutorialState()
    }

    const value = parsed as Record<string, unknown>
    if (
      value.version !== TUTORIAL_SCHEMA_VERSION ||
      !isTutorialStatus(value.status) ||
      !isTutorialPhase(value.phase)
    ) {
      return createInitialTutorialState()
    }

    return {
      version: TUTORIAL_SCHEMA_VERSION,
      status: value.status,
      phase: value.phase,
    }
  } catch {
    return createInitialTutorialState()
  }
}
