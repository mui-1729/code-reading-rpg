import { describe, expect, it } from 'vitest'
import { isWorldPortalRequirementSatisfied } from './worldPortalAccess'

describe('shared World portal requirement', () => {
  it('ungated exits stay open and the first incident alone opens Village', () => {
    expect(isWorldPortalRequirementSatisfied(undefined, [])).toBe(true)
    expect(isWorldPortalRequirementSatisfied(1, [])).toBe(false)
    expect(isWorldPortalRequirementSatisfied(1, [1])).toBe(true)
  })

  it('requires the cleared gate and every ancestor, independent of ID order', () => {
    expect(isWorldPortalRequirementSatisfied(9, [9])).toBe(false)
    expect(isWorldPortalRequirementSatisfied(9, [1, 9])).toBe(false)
    expect(isWorldPortalRequirementSatisfied(9, [1, 7, 8])).toBe(false)
    expect(isWorldPortalRequirementSatisfied(9, [9, 8, 7, 1])).toBe(true)
    expect(isWorldPortalRequirementSatisfied(999, [999])).toBe(false)
  })
})
