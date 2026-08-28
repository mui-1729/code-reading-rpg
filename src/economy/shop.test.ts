import { describe, expect, it } from 'vitest'
import { battles } from '../game/battles'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState, equipmentById } from '../rpg'
import { worldTreasureDefinitions } from '../world/treasures'
import {
  getShopItemPrice,
  getShopItemQuote,
  purchaseShopItem,
  worldShopItems,
} from './shop'

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

  it('quoteでwallet / price / after-purchase Goldを一括算出する', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 70 }
    const quote = getShopItemQuote(progress, createInitialRpgState(), 'guard-edge')

    expect(quote).toMatchObject({
      state: 'available',
      wallet: 70,
      price: 55,
      afterPurchaseGold: 15,
      shortage: 0,
      affordable: true,
    })
  })

  it('Gold不足quoteは不足額を返しafter-purchaseを確定しない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 42 }
    const quote = getShopItemQuote(progress, createInitialRpgState(), 'vital-coat')

    expect(quote).toMatchObject({
      state: 'unavailable',
      wallet: 42,
      price: 60,
      afterPurchaseGold: null,
      shortage: 18,
      affordable: false,
    })
  })

  it('所有済み / 装備中Equipmentをpurchase stateと分離して返す', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 0 }
    const ownedState = {
      ...createInitialRpgState(),
      ownedEquipmentIds: [...createInitialRpgState().ownedEquipmentIds, 'guard-edge'],
    }
    const equippedState = {
      ...ownedState,
      equipment: { ...ownedState.equipment, weapon: 'guard-edge' },
    }

    expect(getShopItemQuote(progress, ownedState, 'guard-edge')?.state).toBe('owned')
    expect(getShopItemQuote(progress, equippedState, 'guard-edge')?.state).toBe('equipped')
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

  it('shop価格と通常進行Gold budgetを固定する', () => {
    const prices = Object.fromEntries(worldShopItems.map((item) => [item.id, getShopItemPrice(item)]))
    expect(prices).toEqual({
      'patch-kit': 30,
      'guard-edge': 55,
      'vital-coat': 60,
      'life-charm': 50,
    })

    expect(
      battles
        .filter((battle) => battle.id >= 1 && battle.id <= 6)
        .map((battle) => battle.goldReward),
    ).toEqual([20, 30, 50, 25, 35, 60])
    expect(
      battles
        .filter((battle) => [7, 8, 9].includes(battle.id))
        .map((battle) => battle.goldReward),
    ).toEqual([0, 0, 0])

    const javascriptFirstClearGold = battles
      .filter((battle) => battle.id >= 1 && battle.id <= 3)
      .reduce((total, battle) => total + battle.goldReward, 0)
    const javascriptWithTreasure =
      javascriptFirstClearGold + worldTreasureDefinitions['js-debug-cache'].reward.gold
    const allShopProducts = worldShopItems.reduce(
      (total, item) => total + getShopItemPrice(item),
      0,
    )
    const cheapestEquipment = Math.min(
      ...worldShopItems
        .filter((item) => item.kind === 'equipment')
        .map((item) => getShopItemPrice(item)),
    )

    expect(javascriptFirstClearGold).toBe(100)
    expect(javascriptWithTreasure).toBe(120)
    expect(javascriptFirstClearGold).toBeGreaterThanOrEqual(prices['patch-kit'] + cheapestEquipment)
    expect(javascriptWithTreasure).toBeLessThan(allShopProducts)
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
