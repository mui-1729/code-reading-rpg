import { PATCH_KIT_PRICE, purchasePatchKit } from '../economy'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'

export type ShopItemDefinition =
  | {
      id: 'patch-kit'
      kind: 'item'
      name: 'PATCH KIT'
      price: number
      description: string
    }
  | {
      id: string
      kind: 'equipment'
      name: string
      equipmentId: string
      price: number
      description: string
    }

export const SHOP_ITEMS: readonly ShopItemDefinition[] = [
  {
    id: 'patch-kit',
    kind: 'item',
    name: 'PATCH KIT',
    price: PATCH_KIT_PRICE,
    description: 'Battle中にHPを回復。何度でも購入できる。',
  },
  {
    id: 'guard-blade',
    kind: 'equipment',
    name: 'Guard Blade',
    equipmentId: 'guard-blade',
    price: 55,
    description: 'Weapon · Defenseも補う安定型。',
  },
  {
    id: 'vital-jacket',
    kind: 'equipment',
    name: 'Vital Jacket',
    equipmentId: 'vital-jacket',
    price: 65,
    description: 'Armor · 最大HPを優先する耐久型。',
  },
  {
    id: 'patch-loop',
    kind: 'equipment',
    name: 'Patch Loop',
    equipmentId: 'patch-loop',
    price: 50,
    description: 'Accessory · PATCH KITの回復量を強化。',
  },
]

export type ShopPurchaseReason = 'purchased' | 'insufficient-gold' | 'owned' | 'unknown-item'

export type ShopPurchaseResult = {
  purchased: boolean
  reason: ShopPurchaseReason
  progress: PlayerProgress
  rpgState: RpgState
  item: ShopItemDefinition | null
}

export function purchaseShopItem(
  progress: PlayerProgress,
  rpgState: RpgState,
  itemId: string,
): ShopPurchaseResult {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId) ?? null
  if (!item) {
    return { purchased: false, reason: 'unknown-item', progress, rpgState, item }
  }

  if (item.kind === 'item') {
    const result = purchasePatchKit(progress)
    return {
      purchased: result.purchased,
      reason: result.purchased ? 'purchased' : 'insufficient-gold',
      progress: result.progress,
      rpgState,
      item,
    }
  }

  if (rpgState.ownedEquipmentIds.includes(item.equipmentId)) {
    return { purchased: false, reason: 'owned', progress, rpgState, item }
  }

  if (progress.gold < item.price) {
    return { purchased: false, reason: 'insufficient-gold', progress, rpgState, item }
  }

  return {
    purchased: true,
    reason: 'purchased',
    item,
    progress: { ...progress, gold: progress.gold - item.price },
    rpgState: {
      ...rpgState,
      ownedEquipmentIds: [...rpgState.ownedEquipmentIds, item.equipmentId],
    },
  }
}
