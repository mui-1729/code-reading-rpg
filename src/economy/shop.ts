import type { PlayerProgress } from '../progression'
import { equipmentById } from '../rpg/equipment'
import type { RpgState } from '../rpg/state'
import { purchasePatchKit } from './economy'
import { itemById, type ItemId } from './items'

export type ShopItemDefinition =
  | {
      id: string
      kind: 'consumable'
      itemId: ItemId
    }
  | {
      id: string
      kind: 'equipment'
      equipmentId: string
      price: number
    }

export type ShopPurchaseReason = 'purchased' | 'insufficient-gold' | 'owned' | 'unknown-item'
export type ShopItemState = 'available' | 'unavailable' | 'owned' | 'equipped'

export type ShopItemQuote = {
  item: ShopItemDefinition
  state: ShopItemState
  wallet: number
  price: number
  afterPurchaseGold: number | null
  shortage: number
  affordable: boolean
}

export type ShopPurchaseResult = {
  progress: PlayerProgress
  rpgState: RpgState
  purchased: boolean
  reason: ShopPurchaseReason
}

export const worldShopItems: readonly ShopItemDefinition[] = [
  { id: 'patch-kit', kind: 'consumable', itemId: 'patch-kit' },
  { id: 'guard-edge', kind: 'equipment', equipmentId: 'guard-edge', price: 55 },
  { id: 'vital-coat', kind: 'equipment', equipmentId: 'vital-coat', price: 60 },
  { id: 'life-charm', kind: 'equipment', equipmentId: 'life-charm', price: 50 },
]

export function getShopItemPrice(item: ShopItemDefinition) {
  return item.kind === 'consumable' ? itemById[item.itemId].price : item.price
}

export function getShopItemQuote(
  progress: PlayerProgress,
  rpgState: RpgState,
  itemId: string,
): ShopItemQuote | null {
  const item = worldShopItems.find((entry) => entry.id === itemId)
  if (!item) return null

  const price = getShopItemPrice(item)
  const affordable = progress.gold >= price
  const shortage = Math.max(0, price - progress.gold)

  let state: ShopItemState = affordable ? 'available' : 'unavailable'

  if (item.kind === 'equipment') {
    const equipment = equipmentById[item.equipmentId]
    if (!equipment) return null

    if (rpgState.equipment[equipment.slot] === equipment.id) {
      state = 'equipped'
    } else if (rpgState.ownedEquipmentIds.includes(equipment.id)) {
      state = 'owned'
    }
  }

  return {
    item,
    state,
    wallet: progress.gold,
    price,
    afterPurchaseGold: state === 'available' ? progress.gold - price : null,
    shortage: state === 'unavailable' ? shortage : 0,
    affordable,
  }
}

export function purchaseShopItem(
  progress: PlayerProgress,
  rpgState: RpgState,
  itemId: string,
): ShopPurchaseResult {
  const quote = getShopItemQuote(progress, rpgState, itemId)
  if (!quote) {
    return { progress, rpgState, purchased: false, reason: 'unknown-item' }
  }

  if (quote.state === 'owned' || quote.state === 'equipped') {
    return { progress, rpgState, purchased: false, reason: 'owned' }
  }

  if (quote.state === 'unavailable') {
    return { progress, rpgState, purchased: false, reason: 'insufficient-gold' }
  }

  const item = quote.item
  if (item.kind === 'consumable') {
    const result = purchasePatchKit(progress)
    return {
      progress: result.progress,
      rpgState,
      purchased: result.purchased,
      reason: result.purchased ? 'purchased' : 'insufficient-gold',
    }
  }

  const equipment = equipmentById[item.equipmentId]
  if (!equipment) {
    return { progress, rpgState, purchased: false, reason: 'unknown-item' }
  }

  return {
    purchased: true,
    reason: 'purchased',
    progress: { ...progress, gold: quote.afterPurchaseGold ?? progress.gold },
    rpgState: {
      ...rpgState,
      ownedEquipmentIds: [...rpgState.ownedEquipmentIds, equipment.id],
    },
  }
}
