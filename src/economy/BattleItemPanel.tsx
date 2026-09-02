import type { PlayerProgress } from '../progression'
import { getBattleItemUseState, getItemCount, getItemEffectSummary, getItemUsageSummary, patchKitItem } from './items'

type BattleItemPanelProps = {
  progress: PlayerProgress
  hp: number
  maxHp: number
  usedThisBattle: boolean
  lastHeal: number | null
  actionLocked: boolean
  onUse: () => void
}

export function BattleItemPanel({ progress, hp, maxHp, usedThisBattle, lastHeal, actionLocked, onUse }: BattleItemPanelProps) {
  const count = getItemCount(progress, patchKitItem.id)
  const itemUseState = getBattleItemUseState({ progress, itemId: patchKitItem.id, hp, maxHp, usedThisBattle, actionLocked })
  const effectSummary = getItemEffectSummary(patchKitItem)

  return (
    <div className="battle-item-row" data-item-id={patchKitItem.id} data-item-state={itemUseState.reason}>
      <details className="battle-item-disclosure">
        <summary className="secondary-button battle-item-toggle">
          <span>ITEM</span>
          <small>{patchKitItem.name} ×{count}</small>
        </summary>
        <div className="battle-item-drawer pixel-inner-window">
          <div className="battle-item-card">
            <img className="item-pixel-icon item-battle-icon" src={patchKitItem.visual} alt="" aria-hidden="true" />
            <span className="battle-item-copy">
              <small>{patchKitItem.categoryLabel}</small>
              <strong>{patchKitItem.name} ×{count}</strong>
              <span>{effectSummary} · {getItemUsageSummary(patchKitItem)}</span>
            </span>
          </div>
          <button type="button" className="secondary-button patch-kit-action" onClick={onUse} disabled={!itemUseState.canUse} aria-label={`${patchKitItem.name} ×${count}を使う · ${effectSummary}`}>
            ▶ 使う
          </button>
          <span className="battle-item-state" aria-live="polite">
            {lastHeal !== null && usedThisBattle
              ? `+${lastHeal} HP回復 · ${itemUseState.reasonLabel}`
              : itemUseState.reasonLabel}
          </span>
        </div>
      </details>
    </div>
  )
}
