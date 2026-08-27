import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState, equipmentById } from '../rpg'
import { purchaseShopItem, worldShopItems } from './shop'

describe('world shop', () => {
  it('PATCH KITを既存economy価格で購入する', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 30 }
    const rpgState = createInitialRpgState()
    const result = purchaseShopItem(progress, rpgState, 'patch-kit')

    expect(result.purchased).toBe(true)
    expect(result.reason).toBe('purchased')
    expect(result.progress.gold).toBe(0)
    expect(result.progress.inventory.patchKit).toBe(1)
    expect(result.rpgState).toBe(rpgState)
  })

  it('Equipment購入でGoldを消費しownedEquipmentIdsへ追加する', () => {
    const shopItem = worldShopItems.find((item) => item.id === 'guard-edge')
    expect(shopItem?.kind).toBe('equipment')
    if (!shopItem || shopItem.kind !== 'equipment') throw new Error('missing shop item')

    const progress = { ...createInitialPlayerProgress(), gold: shopItem.price + 10 }
    const rpgState = createInitialRpgState()
    const result = purchaseShopItem(progress, rpgState, shopItem.id)

    expect(result.purchased).toBe(true)
    expect(result.progress.gold).toBe(10)
    expect(result.rpgState.ownedEquipmentIds).toContain(shopItem.equipmentId)
    expect(rpgState.ownedEquipmentIds).not.toContain(shopItem.equipmentId)
  })

  it('所有済みEquipmentは再購入できない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 999 }
    const rpgState = {
      ...createInitialRpgState(),
      ownedEquipmentIds: [...createInitialRpgState().ownedEquipmentIds, 'guard-edge'],
    }
    const result = purchaseShopItem(progress, rpgState, 'guard-edge')

    expect(result.purchased).toBe(false)
    expect(result.reason).toBe('owned')
    expect(result.progress).toBe(progress)
    expect(result.rpgState).toBe(rpgState)
  })

  it('Gold不足ではEquipmentを購入しない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 0 }
    const rpgState = createInitialRpgState()
    const result = purchaseShopItem(progress, rpgState, 'vital-coat')

    expect(result.purchased).toBe(false)
    expect(result.reason).toBe('insufficient-gold')
    expect(result.progress).toBe(progress)
    expect(result.rpgState).toBe(rpgState)
  })

  it('shop Equipmentはslotごとに単純な完全上位互換ではない役割差を持つ', () => {
    expect(equipmentById['guard-edge'].bonuses).toEqual({ attack: 4, defense: 2 })
    expect(equipmentById['branch-saber'].bonuses).toEqual({ attack: 6 })
    expect(equipmentById['vital-coat'].bonuses).toEqual({ maxHp: 22, defense: 1 })
    expect(equipmentById['typed-mail'].bonuses).toEqual({ maxHp: 12, defense: 5 })
    expect(equipmentById['life-charm'].bonuses).toEqual({ maxHp: 16 })
    expect(equipmentById['debug-charm'].bonuses).toEqual({ attack: 2, defense: 1 })
  })
})
