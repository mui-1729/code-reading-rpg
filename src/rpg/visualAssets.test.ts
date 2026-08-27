import { describe, expect, it } from 'vitest'
import { equipmentDefinitions } from './equipment'
import {
  characterVisuals,
  equipmentVisuals,
  getEquipmentVisual,
  getWeaponVisual,
} from './visualAssets'

describe('pixel visual assets', () => {
  it('maps field and battle sprites for player and BYTE', () => {
    expect(characterVisuals.player.field).toContain('code-knight-field')
    expect(characterVisuals.player.battle).toContain('code-knight-battle')
    expect(characterVisuals.byte.field).toContain('byte-field')
    expect(characterVisuals.byte.battle).toContain('byte-battle')
  })

  it('maps every equipment definition to the generic equipment registry', () => {
    expect(Object.keys(equipmentVisuals).sort()).toEqual(
      equipmentDefinitions.map((item) => item.id).sort(),
    )

    for (const equipment of equipmentDefinitions) {
      expect(getEquipmentVisual(equipment.id)).toContain(`/equipment/`)
      expect(getEquipmentVisual(equipment.id)).toContain(equipment.id)
    }
  })

  it('returns null for unsupported equipment and keeps the battle weapon compatibility helper', () => {
    expect(getEquipmentVisual('missing-equipment')).toBeNull()
    expect(getEquipmentVisual(null)).toBeNull()
    expect(getWeaponVisual('guard-edge')).toBe(getEquipmentVisual('guard-edge'))
  })
})
