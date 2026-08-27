import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { purchaseShopItem, SHOP_ITEMS } from './shop'

const withGold = (gold: number) => ({ ...createInitialPlayerProgress(), gold })

describe('Hub Shop', () => {
  it('PATCH KITを繰り返し購入できる', () => {
    const rpgState = createInitialRpgState()
    const first = purchaseShopItem(withGold(60), rpgState, 'patch-kit')
    const second = purchaseShopItem(first.progress, first.rpgState, 'patch-kit')

    expect(first.purchased).toBe(true)
    expect(second.purchased).toBe(true)
    expect(second.progress.gold).toBe(0)
    expect(second.progress.inventory.patchKit).toBe(2)
  })

  it('Equipment購入でGoldを消費してownedEquipmentIdsへ追加する', () => {
    const rpgState = createInitialRpgState()
    const item = SHOP_ITEMS.find((candidate) => candidate.id === 'guard-blade')
    expect(item?.price).toBe(55)

    const result = purchaseShopItem(withGold(80), rpgState, 'guard-blade')

    expect(result.purchased).toBe(true)
    expect(result.reason).toBe('purchased')
    expect(result.progress.gold).toBe(25)
    expect(result.rpgState.ownedEquipmentIds).toContain('guard-blade')
    expect(rpgState.ownedEquipmentIds).not.toContain('guard-blade')
  })

  it('Gold不足ではEquipmentを追加しない', () => {
    const progress = withGold(54)
    const rpgState = createInitialRpgState()
    const result = purchaseShopItem(progress, rpgState, 'guard-blade')

    expect(result.purchased).toBe(false)
    expect(result.reason).toBe('insufficient-gold')
    expect(result.progress).toBe(progress)
    expect(result.rpgState).toBe(rpgState)
  })

  it('所有済みEquipmentは二重購入しない', () => {
    const progress = withGold(999)
    const rpgState = {
      ...createInitialRpgState(),
      ownedEquipmentIds: [...createInitialRpgState().ownedEquipmentIds, 'patch-loop'],
    }
    const result = purchaseShopItem(progress, rpgState, 'patch-loop')

    expect(result.purchased).toBe(false)
    expect(result.reason).toBe('owned')
    expect(result.progress.gold).toBe(999)
    expect(result.rpgState.ownedEquipmentIds.filter((id) => id === 'patch-loop')).toHaveLength(1)
  })
})
