import type { PlayerProgress } from '../progression'
import { equipmentById } from '../rpg/equipment'
import type { RpgState } from '../rpg/state'
import { PATCH_KIT_PRICE, purchasePatchKit } from './economy'

export type ShopItemDefinition =
  | {
      id: 'patch-kit'
      kind: 'consumable'
      name: 'PATCH KIT'
      price: number
    }
  | {
      id: string
      kind: 'equipment'
      equipmentId: string
      price: number
    }

export type ShopPurchaseReason = 'purchased' | 'insufficient-gold' | 'owned' | 'unknown-item'

export type ShopPurchaseResult = {
  progress: PlayerProgress
  rpgState: RpgState
  purchased: boolean
  reason: ShopPurchaseReason
}

export const worldShopItems: readonly ShopItemDefinition[] = [
  { id: 'patch-kit', kind: 'consumable', name: 'PATCH KIT', price: PATCH_KIT_PRICE },
  { id: 'guard-edge', kind: 'equipment', equipmentId: 'guard-edge', price: 55 },
  { id: 'vital-coat', kind: 'equipment', equipmentId: 'vital-coat', price: 60 },
  { id: 'life-charm', kind: 'equipment', equipmentId: 'life-charm', price: 50 },
]

export function purchaseShopItem(
  progress: PlayerProgress,
  rpgState: RpgState,
  itemId: string,
): ShopPurchaseResult {
  const item = worldShopItems.find((entry) => entry.id === itemId)
  if (!item) {
    return { progress, rpgState, purchased: false, reason: 'unknown-item' }
  }

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

  if (rpgState.ownedEquipmentIds.includes(equipment.id)) {
    return { progress, rpgState, purchased: false, reason: 'owned' }
  }

  if (progress.gold < item.price) {
    return { progress, rpgState, purchased: false, reason: 'insufficient-gold' }
  }

  return {
    purchased: true,
    reason: 'purchased',
    progress: { ...progress, gold: progress.gold - item.price },
    rpgState: {
      ...rpgState,
      ownedEquipmentIds: [...rpgState.ownedEquipmentIds, equipment.id],
    },
  }
}
