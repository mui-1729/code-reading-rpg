import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [commandHost, setCommandHost] = useState<HTMLElement | null>(null)
  const selectedItem = itemDefinitions.find((item) => item.id === selectedItemId) ?? null

  useEffect(() => {
    setCommandHost(document.querySelector<HTMLElement>('.battle-screen .battle-console'))
  }, [])

  const selectedItemState = selectedItem
    ? getBattleItemUseState({
        progress,
        itemId: selectedItem.id,
        hp,
        maxHp,
        usedThisBattle: selectedItem.id === 'patch-kit' ? patchKitUsed : false,
        actionLocked,
      })
    : null

  const itemMenu = (
    <div className="battle-item-submenu" role="group" aria-label="アイテム選択">
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
          const selected = selectedItemId === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`battle-item-browser-row ${selected ? 'is-selected' : ''}`}
              data-item-id={item.id}
              aria-pressed={selected}
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
      <div className="battle-item-submenu-actions">
        <span className="battle-item-state" aria-live="polite">
          {selectedItem
            ? lastPatchKitHeal !== null && patchKitUsed && selectedItem.id === 'patch-kit'
              ? `+${lastPatchKitHeal} HP回復 · ${selectedItemState?.reasonLabel ?? ''}`
              : selectedItemState?.reasonLabel
            : 'アイテムを選択してください'}
        </span>
        <button
          type="button"
          className="secondary-button patch-kit-action"
          disabled={!selectedItem || selectedItem.id !== 'patch-kit' || !selectedItemState?.canUse}
          onClick={selectedItem?.id === 'patch-kit' ? onUsePatchKit : undefined}
          aria-label={selectedItem
            ? `${selectedItem.name} ×${getItemCount(progress, selectedItem.id)}を使う · ${getItemEffectSummary(selectedItem)}`
            : 'アイテムを使う'}
        >
          ▶ 使う
        </button>
      </div>
    </div>
  )

  return (
    <>
      {selectedItem ? (
        <div className="battle-item-browser battle-item-detail" data-item-id={selectedItem.id} aria-label="戦闘アイテム詳細">
          <div className="battle-item-browser-head">
            <strong>{selectedItem.name}</strong>
            <span>{selectedItem.categoryLabel}</span>
          </div>
          <div className="battle-item-detail-card">
            <img className="item-pixel-icon item-battle-detail-icon" src={selectedItem.visual} alt="" aria-hidden="true" />
            <div>
              <strong>{selectedItem.name} ×{getItemCount(progress, selectedItem.id)}</strong>
              <p>{selectedItem.description}</p>
              <span>{getItemEffectSummary(selectedItem)} · {getItemUsageSummary(selectedItem)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="battle-item-browser battle-item-detail-empty" aria-label="戦闘アイテム詳細">
          <strong>アイテム</strong>
          <p>下の一覧からアイテムを選ぶと、ここに詳細が表示されます。</p>
        </div>
      )}
      {commandHost ? createPortal(itemMenu, commandHost) : null}
    </>
  )
}
