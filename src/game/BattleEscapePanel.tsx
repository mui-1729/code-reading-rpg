import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { isBattleEscapeAllowed } from './battleEscape'

type BattleLocation = {
  battleId: number
  seed: string | null
  returnTo: string | null
}

function readBattleLocation(): BattleLocation | null {
  if (typeof window === 'undefined') return null
  const match = window.location.pathname.match(/^\/(?:javascript|typescript)\/battle\/(\d+)$/)
  if (!match) return null

  const battleId = Number(match[1])
  if (!Number.isInteger(battleId)) return null
  const search = new URLSearchParams(window.location.search)
  return {
    battleId,
    seed: search.get('seed'),
    returnTo: search.get('returnTo'),
  }
}

export function BattleEscapePanel() {
  const { progress } = useProgress()
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)
  const [location, setLocation] = useState<BattleLocation | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const syncBattleUi = () => {
      setLocation(readBattleLocation())
      setPortalTarget(document.querySelector('.battle-console'))
    }

    syncBattleUi()
    const observer = new MutationObserver(syncBattleUi)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('popstate', syncBattleUi)
    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', syncBattleUi)
    }
  }, [])

  if (!portalTarget || !location) return null

  const allowed = isBattleEscapeAllowed({
    ...location,
    clearedStageIds: progress.clearedStageIds,
  })

  const escape = () => {
    if (!allowed || location.returnTo !== '/world') {
      gameAudio.playSe('cancel')
      return
    }
    gameAudio.playSe('confirm')
    window.location.assign('/world')
  }

  return createPortal(
    <div className="battle-escape-row">
      <button
        type="button"
        className="secondary-button battle-escape-action"
        onClick={escape}
        disabled={!allowed}
      >
        {allowed ? 'RUN · ESCAPE' : 'RUN LOCKED · FIXED BATTLE'}
      </button>
      <span className="battle-item-state">
        {allowed
          ? 'Random Encounterから離脱し、元いたWorld位置へ戻る · reward / clearなし'
          : 'Fixed Lesson / Bossは最後まで挑戦する'}
      </span>
    </div>,
    portalTarget,
  )
}
