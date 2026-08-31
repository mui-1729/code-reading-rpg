import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression/progression'
import { createInitialRpgState } from '../rpg/state'
import { hasExistingRun } from './openingProgress'

describe('opening existing-run detection', () => {
  it('fresh normalized state still starts with the opening', () => {
    expect(hasExistingRun(createInitialRpgState(), createInitialPlayerProgress())).toBe(false)
  })

  it('unified/migrated state identifies an existing run without legacy storage keys', () => {
    expect(hasExistingRun({ ...createInitialRpgState(), partyMemberIds: ['byte'] }, createInitialPlayerProgress())).toBe(true)
    expect(hasExistingRun(createInitialRpgState(), { ...createInitialPlayerProgress(), clearedStageIds: [7] })).toBe(true)
  })
})
