import type { PlayerProgress } from '../progression'
import { getBattleItemUseState, patchKitItem } from './items'

export const PATCH_KIT_PRICE = patchKitItem.price
export const PATCH_KIT_HEAL = patchKitItem.effect.amount

export type PurchaseResult = {
  progress: PlayerProgress
  purchased: boolean
}

export type ConsumePatchKitResult = {
  progress: PlayerProgress
  consumed: boolean
  hp: number
  healed: number
  usedThisBattle: boolean
}

export function purchasePatchKit(progress: PlayerProgress): PurchaseResult {
  if (progress.gold < patchKitItem.price) {
    return { progress, purchased: false }
  }

  return {
    purchased: true,
    progress: {
      ...progress,
      gold: progress.gold - patchKitItem.price,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit + 1,
      },
    },
  }
}

export function consumePatchKit(
  progress: PlayerProgress,
  hp: number,
  maxHp: number,
  usedThisBattle = false,
): ConsumePatchKitResult {
  const normalizedMaxHp = Math.max(1, Math.floor(maxHp))
  const normalizedHp = Math.max(0, Math.min(normalizedMaxHp, Math.floor(hp)))
  const useState = getBattleItemUseState({
    progress,
    itemId: patchKitItem.id,
    hp: normalizedHp,
    maxHp: normalizedMaxHp,
    usedThisBattle,
  })

  if (!useState.canUse) {
    return {
      progress,
      consumed: false,
      hp: normalizedHp,
      healed: 0,
      usedThisBattle,
    }
  }

  const nextHp = Math.min(normalizedMaxHp, normalizedHp + patchKitItem.effect.amount)

  return {
    consumed: true,
    hp: nextHp,
    healed: nextHp - normalizedHp,
    usedThisBattle: true,
    progress: {
      ...progress,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit - 1,
      },
    },
  }
}
