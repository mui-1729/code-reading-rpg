import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { consumePatchKit } from './economy'
import {
  getBattleItemUseState,
  getItemCount,
  getItemEffectSummary,
  getItemUsageSummary,
  patchKitItem,
} from './items'

export function BattleItemPanel() {
  const { progress, stats, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)
  const [battleLocation, setBattleLocation] = useState('')
  const [actionLocked, setActionLocked] = useState(false)
  const [usedThisBattle, setUsedThisBattle] = useState(false)
  const [lastHeal, setLastHeal] = useState<number | null>(null)
  const locationRef = useRef('')

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const syncBattleUi = () => {
      const nextLocation = `${window.location.pathname}${window.location.search}`
      if (locationRef.current !== nextLocation) {
        locationRef.current = nextLocation
        setBattleLocation(nextLocation)
        setUsedThisBattle(false)
        setLastHeal(null)
      }

      const target = document.querySelector('.battle-console')
      setPortalTarget(target)
      setActionLocked(Boolean(target?.querySelector('.skill-card:disabled')))
    }

    syncBattleUi()
    const observer = new MutationObserver(syncBattleUi)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.addEventListener('popstate', syncBattleUi)

    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', syncBattleUi)
    }
  }, [])

  if (!portalTarget || !battleLocation.includes('/battle/')) return null

  const combatStats = getCombatStats(stats, rpgState)
  const hp = Math.max(0, Math.min(combatStats.maxHp, rpgState.currentHp))
  const count = getItemCount(progress, patchKitItem.id)
  const itemUseState = getBattleItemUseState({
    progress,
    itemId: patchKitItem.id,
    hp,
    maxHp: combatStats.maxHp,
    usedThisBattle,
    actionLocked,
  })
  const effectSummary = getItemEffectSummary(patchKitItem)

  const usePatchKit = () => {
    if (!itemUseState.canUse) {
      gameAudio.playSe('cancel')
      return
    }

    const result = consumePatchKit(progress, hp, combatStats.maxHp, usedThisBattle)
    if (!result.consumed) {
      gameAudio.playSe('cancel')
      return
    }

    gameAudio.playSe('confirm')
    setProgress(result.progress)
    setRpgState((current) => ({ ...current, currentHp: result.hp }))
    setUsedThisBattle(result.usedThisBattle)
    setLastHeal(result.healed)
  }

  return createPortal(
    <div
      className="battle-item-row"
      data-item-id={patchKitItem.id}
      data-item-state={itemUseState.reason}
    >
      <div className="battle-item-card">
        <img
          className="item-pixel-icon item-battle-icon"
          src={patchKitItem.visual}
          alt=""
          aria-hidden="true"
        />
        <span className="battle-item-copy">
          <small>{patchKitItem.categoryLabel}</small>
          <strong>{patchKitItem.name} ×{count}</strong>
          <span>{effectSummary} · {getItemUsageSummary(patchKitItem)}</span>
        </span>
      </div>
      <button
        type="button"
        className="secondary-button patch-kit-action"
        onClick={usePatchKit}
        disabled={!itemUseState.canUse}
        aria-label={`${patchKitItem.name} ×${count} · ${effectSummary}`}
      >
        ▶ USE
      </button>
      <span className="battle-item-state" aria-live="polite">
        {lastHeal !== null && usedThisBattle
          ? `RECOVERED +${lastHeal} HP · ${itemUseState.reasonLabel}`
          : itemUseState.reasonLabel}
      </span>
    </div>,
    portalTarget,
  )
}
