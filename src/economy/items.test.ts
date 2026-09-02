import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import {
  getBattleItemUseState,
  getItemCount,
  getItemEffectSummary,
  getItemUsageSummary,
  itemById,
  itemDefinitions,
  patchKitItem,
} from './items'

describe('item catalog', () => {
  it('PATCH KITのpresentationとruleを1つのdefinitionから取得する', () => {
    expect(itemDefinitions).toHaveLength(1)
    expect(itemById['patch-kit']).toBe(patchKitItem)
    expect(patchKitItem.name).toBe('PATCH KIT')
    expect(patchKitItem.price).toBe(30)
    expect(patchKitItem.effect).toEqual({ kind: 'heal', amount: 24 })
    expect(patchKitItem.usage).toEqual({ location: 'battle', maxUsesPerBattle: 1 })
    expect(patchKitItem.visual).toBe('/pixel-art/items/patch-kit.svg')
    expect(getItemEffectSummary(patchKitItem)).toBe('HP +24')
    expect(getItemUsageSummary(patchKitItem)).toBe('戦闘専用 · 1回')
  })

  it('existing inventory.patchKitをItem countとして読む', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      inventory: { patchKit: 3 },
    }

    expect(getItemCount(progress, 'patch-kit')).toBe(3)
  })

  it('Battleで使用可能状態を返す', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      inventory: { patchKit: 1 },
    }

    expect(getBattleItemUseState({
      progress,
      itemId: 'patch-kit',
      hp: 50,
      maxHp: 100,
    })).toEqual({ canUse: true, reason: 'available', reasonLabel: '使用可能 · 戦闘専用' })
  })

  it.each([
    ['no stock', { patchKit: 0 }, 50, false, false, 'no-stock', '所持なし'],
    ['hp full', { patchKit: 1 }, 100, false, false, 'hp-full', 'HP満タン'],
    ['already used', { patchKit: 1 }, 50, true, false, 'already-used', 'この戦闘では使用済み'],
    ['action locked', { patchKit: 1 }, 50, false, true, 'action-locked', '行動不可'],
  ] as const)(
    '%sの理由を返す',
    (_label, inventory, hp, usedThisBattle, actionLocked, reason, reasonLabel) => {
      const progress = {
        ...createInitialPlayerProgress(),
        inventory,
      }

      expect(getBattleItemUseState({
        progress,
        itemId: 'patch-kit',
        hp,
        maxHp: 100,
        usedThisBattle,
        actionLocked,
      })).toEqual({ canUse: false, reason, reasonLabel })
    },
  )
})
