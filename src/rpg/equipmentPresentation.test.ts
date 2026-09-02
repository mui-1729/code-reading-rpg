import { describe, expect, it } from 'vitest'
import { EMPTY_EQUIPMENT } from './equipment'
import {
  formatEquipmentBonuses,
  getEquipmentPresentation,
} from './equipmentPresentation'

describe('equipment presentation', () => {
  it('formats equipment bonuses in a stable stat order', () => {
    expect(formatEquipmentBonuses({ maxHp: 12, attack: 2, defense: 5 })).toBe(
      'ATK +2 · DEF +5 · HP +12',
    )
  })

  it('compares a weapon with the currently equipped weapon', () => {
    const presentation = getEquipmentPresentation('guard-edge', {
      ...EMPTY_EQUIPMENT,
      weapon: 'training-blade',
    })

    expect(presentation?.currentEquipmentName).toBe('Training Blade')
    expect(presentation?.delta).toEqual({ maxHp: 0, attack: 1, defense: 2 })
    expect(presentation?.deltaSummary).toBe('ATK +1 · DEF +2')
  })

  it('shows both positive and negative armor deltas', () => {
    const presentation = getEquipmentPresentation('vital-coat', {
      ...EMPTY_EQUIPMENT,
      armor: 'traveler-coat',
    })

    expect(presentation?.currentEquipmentName).toBe('Traveler Coat')
    expect(presentation?.deltaSummary).toBe('DEF -2 · HP +14')
  })

  it('describes equipping into an empty slot without player-facing EMPTY copy', () => {
    const presentation = getEquipmentPresentation('life-charm', EMPTY_EQUIPMENT)

    expect(presentation?.currentEquipmentName).toBe('未装備')
    expect(presentation?.deltaSummary).toBe('装備すると HP +16')
  })

  it('marks the currently equipped definition as unchanged', () => {
    const presentation = getEquipmentPresentation('typed-mail', {
      ...EMPTY_EQUIPMENT,
      armor: 'typed-mail',
    })

    expect(presentation?.deltaSummary).toBe('NO STAT CHANGE')
  })
})
