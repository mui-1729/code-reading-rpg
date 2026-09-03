import { useState } from 'react'
import type { PlayerProgress } from '../progression'
import {
  getBattleItemUseState,
  getItemCount,
  getItemEffectSummary,
  getItemUsageSummary,
  itemDefinitions,
  type ItemId,
} from './items'

type BattleItemBrowserProps = {
  progress: PlayerProgress
  hp: number
  maxHp: number
  patchKitUsed: boolean
  lastPatchKitHeal: number | null
  actionLocked: boolean
  onUsePatchKit: () => void
}

export function BattleItemBrowser({
  progress,
  hp,
  maxHp,
  patchKitUsed,
  lastPatchKitHeal,
  actionLocked,
  onUsePatchKit,
}: BattleItemBrowserProps) {
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null)
  const selectedItem = itemDefinitions.find((item) => item.id === selectedItemId) ?? null

  if (!selectedItem) {
    return (
      <div className="battle-item-browser" aria-label="戦闘アイテム一覧">
        <div className="battle-item-browser-head">
          <strong>アイテム</strong>
          <span>使うアイテムを選ぶ</span>
        </div>
        <div className="battle-item-browser-list">
          {itemDefinitions.map((item) => {
            const count = getItemCount(progress, item.id)
            const itemState = getBattleItemUseState({
              progress,
              itemId: item.id,
              hp,
              maxHp,
              usedThisBattle: item.id === 'patch-kit' ? patchKitUsed : false,
              actionLocked,
            })
            return (
              <button
                key={item.id}
                type="button"
                className="battle-item-browser-row"
                data-item-id={item.id}
                onClick={() => setSelectedItemId(item.id)}
              >
                <img className="item-pixel-icon item-battle-icon" src={item.visual} alt="" aria-hidden="true" />
                <span>
                  <strong>{item.name} ×{count}</strong>
                  <small>{getItemEffectSummary(item)} · {getItemUsageSummary(item)}</small>
                </span>
                <em data-item-availability={itemState.reason}>{itemState.reasonLabel}</em>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const count = getItemCount(progress, selectedItem.id)
  const itemState = getBattleItemUseState({
    progress,
    itemId: selectedItem.id,
    hp,
    maxHp,
    usedThisBattle: selectedItem.id === 'patch-kit' ? patchKitUsed : false,
    actionLocked,
  })

  return (
    <div className="battle-item-browser battle-item-detail" data-item-id={selectedItem.id}>
      <div className="battle-item-browser-head">
        <button type="button" className="battle-item-back" onClick={() => setSelectedItemId(null)}>
          ← 一覧へ
        </button>
        <span>{selectedItem.categoryLabel}</span>
      </div>
      <div className="battle-item-detail-card">
        <img className="item-pixel-icon item-battle-detail-icon" src={selectedItem.visual} alt="" aria-hidden="true" />
        <div>
          <strong>{selectedItem.name} ×{count}</strong>
          <p>{selectedItem.description}</p>
          <span>{getItemEffectSummary(selectedItem)} · {getItemUsageSummary(selectedItem)}</span>
        </div>
      </div>
      <div className="battle-item-detail-actions">
        <span className="battle-item-state" aria-live="polite">
          {lastPatchKitHeal !== null && patchKitUsed && selectedItem.id === 'patch-kit'
            ? `+${lastPatchKitHeal} HP回復 · ${itemState.reasonLabel}`
            : itemState.reasonLabel}
        </span>
        <button
          type="button"
          className="secondary-button patch-kit-action"
          disabled={!itemState.canUse}
          onClick={selectedItem.id === 'patch-kit' ? onUsePatchKit : undefined}
          aria-label={`${selectedItem.name} ×${count}を使う · ${getItemEffectSummary(selectedItem)}`}
        >
          ▶ 使う
        </button>
      </div>
    </div>
  )
}
