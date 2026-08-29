import { describe, expect, it } from 'vitest'
import { restoreTutorialState, serializeTutorialState } from './storage'
import { createInitialTutorialState } from './tutorial'

describe('tutorial storage', () => {
  it('version付きstateをserialize / restoreできる', () => {
    const state = { version: 1 as const, status: 'active' as const, phase: 'battle' as const }
    const raw = serializeTutorialState(state)

    expect(restoreTutorialState(raw)).toEqual(state)
  })

  it('party-join phaseをreload後も保持する', () => {
    const state = { version: 1 as const, status: 'active' as const, phase: 'party-join' as const }
    expect(restoreTutorialState(serializeTutorialState(state))).toEqual(state)
  })

  it('completed / skippedを保持する', () => {
    expect(
      restoreTutorialState(JSON.stringify({ version: 1, status: 'completed', phase: 'battle' })),
    ).toEqual({ version: 1, status: 'completed', phase: 'battle' })

    expect(
      restoreTutorialState(
        JSON.stringify({ version: 1, status: 'skipped', phase: 'field-interact' }),
      ),
    ).toEqual({ version: 1, status: 'skipped', phase: 'field-interact' })
  })

  it('保存データがない場合は初期状態へfallbackする', () => {
    expect(restoreTutorialState(null)).toEqual(createInitialTutorialState())
  })

  it('壊れたJSONでは初期状態へfallbackする', () => {
    expect(restoreTutorialState('{not-json')).toEqual(createInitialTutorialState())
  })

  it('未知versionでは初期状態へfallbackする', () => {
    expect(
      restoreTutorialState(JSON.stringify({ version: 999, status: 'active', phase: 'battle' })),
    ).toEqual(createInitialTutorialState())
  })

  it('未知status / phaseでは初期状態へfallbackする', () => {
    expect(
      restoreTutorialState(JSON.stringify({ version: 1, status: 'unknown', phase: 'battle' })),
    ).toEqual(createInitialTutorialState())
    expect(
      restoreTutorialState(JSON.stringify({ version: 1, status: 'active', phase: 'unknown' })),
    ).toEqual(createInitialTutorialState())
  })
})
