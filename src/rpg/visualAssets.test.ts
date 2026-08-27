import { describe, expect, it } from 'vitest'
import { characterVisuals, getWeaponVisual, weaponVisuals } from './visualAssets'

describe('pixel visual assets', () => {
  it('maps field and battle sprites for player and BYTE', () => {
    expect(characterVisuals.player.field).toContain('code-knight-field')
    expect(characterVisuals.player.battle).toContain('code-knight-battle')
    expect(characterVisuals.byte.field).toContain('byte-field')
    expect(characterVisuals.byte.battle).toContain('byte-battle')
  })

  it('maps supported weapon ids and returns null for unsupported equipment', () => {
    expect(Object.keys(weaponVisuals)).toEqual([
      'training-blade',
      'guard-edge',
      'branch-saber',
    ])
    expect(getWeaponVisual('guard-edge')).toContain('guard-edge')
    expect(getWeaponVisual('typed-mail')).toBeNull()
    expect(getWeaponVisual(null)).toBeNull()
  })
})
