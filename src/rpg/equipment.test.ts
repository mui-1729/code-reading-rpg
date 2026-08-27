import { describe, expect, it } from 'vitest'
import { equipmentById, getEquipmentBonuses, type EquipmentLoadout } from './equipment'

const loadout = (equipmentId: string): EquipmentLoadout => {
  const item = equipmentById[equipmentId]
  if (!item) throw new Error(`Unknown equipment: ${equipmentId}`)

  return {
    weapon: item.slot === 'weapon' ? item.id : null,
    armor: item.slot === 'armor' ? item.id : null,
    accessory: item.slot === 'accessory' ? item.id : null,
  }
}

describe('equipment roles', () => {
  it('Weaponは安定型とAttack特化でtrade-offになる', () => {
    const trainingBlade = getEquipmentBonuses(loadout('training-blade'))
    const branchSaber = getEquipmentBonuses(loadout('branch-saber'))

    expect(branchSaber.attack).toBeGreaterThan(trainingBlade.attack)
    expect(trainingBlade.defense).toBeGreaterThan(branchSaber.defense)
  })

  it('ArmorはMax HP型とDefense型でtrade-offになる', () => {
    const travelerCoat = getEquipmentBonuses(loadout('traveler-coat'))
    const typedMail = getEquipmentBonuses(loadout('typed-mail'))

    expect(travelerCoat.maxHp).toBeGreaterThan(typedMail.maxHp)
    expect(typedMail.defense).toBeGreaterThan(travelerCoat.defense)
  })

  it('Accessoryは攻撃寄りと防御寄りでtrade-offになる', () => {
    const debugCharm = getEquipmentBonuses(loadout('debug-charm'))
    const safetyCharm = getEquipmentBonuses(loadout('safety-charm'))

    expect(debugCharm.attack).toBeGreaterThan(safetyCharm.attack)
    expect(safetyCharm.maxHp).toBeGreaterThan(debugCharm.maxHp)
    expect(safetyCharm.defense).toBeGreaterThan(debugCharm.defense)
  })

  it('複数slotのbonusをpureに合算する', () => {
    const equipment: EquipmentLoadout = {
      weapon: 'branch-saber',
      armor: 'typed-mail',
      accessory: 'safety-charm',
    }

    expect(getEquipmentBonuses(equipment)).toEqual({
      maxHp: 18,
      attack: 7,
      defense: 7,
    })
  })
})
