import type { PlayerProgress } from '../progression'

export const PATCH_KIT_PRICE = 30
export const PATCH_KIT_HEAL = 24

export type PurchaseResult = {
  progress: PlayerProgress
  purchased: boolean
}

export type ConsumePatchKitResult = {
  progress: PlayerProgress
  consumed: boolean
  hp: number
  healed: number
}

export function purchasePatchKit(progress: PlayerProgress): PurchaseResult {
  if (progress.gold < PATCH_KIT_PRICE) {
    return { progress, purchased: false }
  }

  return {
    purchased: true,
    progress: {
      ...progress,
      gold: progress.gold - PATCH_KIT_PRICE,
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
): ConsumePatchKitResult {
  const normalizedMaxHp = Math.max(1, Math.floor(maxHp))
  const normalizedHp = Math.max(0, Math.min(normalizedMaxHp, Math.floor(hp)))

  if (progress.inventory.patchKit <= 0 || normalizedHp >= normalizedMaxHp) {
    return { progress, consumed: false, hp: normalizedHp, healed: 0 }
  }

  const nextHp = Math.min(normalizedMaxHp, normalizedHp + PATCH_KIT_HEAL)

  return {
    consumed: true,
    hp: nextHp,
    healed: nextHp - normalizedHp,
    progress: {
      ...progress,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit - 1,
      },
    },
  }
}
