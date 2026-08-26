import type { PlayerProgress } from '../progression/types'

export const PATCH_KIT_COST = 35
export const PATCH_KIT_HEAL = 24

export type PurchasePatchKitResult = {
  progress: PlayerProgress
  purchased: boolean
}

export type ConsumePatchKitResult = {
  progress: PlayerProgress
  consumed: boolean
}

export function purchasePatchKit(progress: PlayerProgress): PurchasePatchKitResult {
  if (progress.gold < PATCH_KIT_COST) {
    return { progress, purchased: false }
  }

  return {
    progress: {
      ...progress,
      gold: progress.gold - PATCH_KIT_COST,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit + 1,
      },
    },
    purchased: true,
  }
}

export function consumePatchKit(progress: PlayerProgress): ConsumePatchKitResult {
  if (progress.inventory.patchKit <= 0) {
    return { progress, consumed: false }
  }

  return {
    progress: {
      ...progress,
      inventory: {
        ...progress.inventory,
        patchKit: progress.inventory.patchKit - 1,
      },
    },
    consumed: true,
  }
}

export function getPatchedHp(currentHp: number, maxHp: number): number {
  const normalizedMaxHp = Math.max(0, maxHp)
  const normalizedHp = Math.max(0, Math.min(normalizedMaxHp, currentHp))
  return Math.min(normalizedMaxHp, normalizedHp + PATCH_KIT_HEAL)
}
