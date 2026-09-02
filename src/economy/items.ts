import type { PlayerProgress } from '../progression'

export type ItemId = 'patch-kit'

export type ItemDefinition = {
  id: ItemId
  name: string
  categoryLabel: string
  description: string
  price: number
  visual: string
  effect: {
    kind: 'heal'
    amount: number
  }
  usage: {
    location: 'battle' | 'field'
    maxUsesPerBattle: number
  }
}

export type BattleItemUseReason =
  | 'available'
  | 'no-stock'
  | 'hp-full'
  | 'already-used'
  | 'action-locked'

export type BattleItemUseState = {
  canUse: boolean
  reason: BattleItemUseReason
  reasonLabel: string
}

export const patchKitItem: ItemDefinition = {
  id: 'patch-kit',
  name: 'PATCH KIT',
  categoryLabel: '戦闘アイテム',
  description: '壊れた戦闘装備を応急修復し、HPを回復する携帯用キット。',
  price: 30,
  visual: '/pixel-art/items/patch-kit.svg',
  effect: {
    kind: 'heal',
    amount: 24,
  },
  usage: {
    location: 'battle',
    maxUsesPerBattle: 1,
  },
}

export const itemDefinitions: readonly ItemDefinition[] = [patchKitItem]

export const itemById: Readonly<Record<ItemId, ItemDefinition>> = {
  'patch-kit': patchKitItem,
}

export function getItemCount(progress: PlayerProgress, itemId: ItemId) {
  if (itemId === 'patch-kit') return progress.inventory.patchKit
  return 0
}

export function getItemEffectSummary(item: ItemDefinition) {
  if (item.effect.kind === 'heal') return `HP +${item.effect.amount}`
  return '補助効果'
}

export function getItemUsageSummary(item: ItemDefinition) {
  if (item.usage.location === 'battle') {
    return `戦闘専用 · ${item.usage.maxUsesPerBattle}回`
  }
  return 'フィールド専用'
}

export function getBattleItemUseState(input: {
  progress: PlayerProgress
  itemId: ItemId
  hp: number
  maxHp: number
  usedThisBattle?: boolean
  actionLocked?: boolean
}): BattleItemUseState {
  const item = itemById[input.itemId]
  const maxHp = Math.max(1, Math.floor(input.maxHp))
  const hp = Math.max(0, Math.min(maxHp, Math.floor(input.hp)))
  const count = getItemCount(input.progress, input.itemId)

  if (input.usedThisBattle && item.usage.maxUsesPerBattle <= 1) {
    return { canUse: false, reason: 'already-used', reasonLabel: 'この戦闘では使用済み' }
  }
  if (count <= 0) {
    return { canUse: false, reason: 'no-stock', reasonLabel: '所持なし' }
  }
  if (item.effect.kind === 'heal' && hp >= maxHp) {
    return { canUse: false, reason: 'hp-full', reasonLabel: 'HP満タン' }
  }
  if (input.actionLocked) {
    return { canUse: false, reason: 'action-locked', reasonLabel: '行動不可' }
  }

  return { canUse: true, reason: 'available', reasonLabel: '使用可能 · 戦闘専用' }
}
