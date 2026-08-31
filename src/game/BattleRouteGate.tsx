import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useProgress } from '../progression'
import { parseBattleRoute } from './areas'
import { getBattleRouteLockReason, isBattleRouteUnlocked } from './battleRouteAccess'

const FLASH_KEY = 'code-reading-rpg:battle-route-lock'

export function BattleRouteGate() {
  const { progress } = useProgress()
  const location = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      hash: state.location.hash,
    }),
  })
  const battleRoute = parseBattleRoute(location.pathname)

  useEffect(() => {
    if (!battleRoute) return
    const { area, battleId } = battleRoute
    if (isBattleRouteUnlocked(area.id, battleId, progress)) return

    const reason = getBattleRouteLockReason(area.id, battleId)
    window.sessionStorage.setItem(FLASH_KEY, reason)
    window.location.replace(`${area.routes.world}#battle-locked`)
  }, [battleRoute, progress])

  const notice =
    location.pathname === '/world' && location.hash.replace(/^#/, '') === 'battle-locked'
      ? window.sessionStorage.getItem(FLASH_KEY)
      : null

  if (!notice) return null

  return (
    <aside
      className="pixel-window"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        zIndex: 160,
        top: 'max(12px, env(safe-area-inset-top))',
        left: '50%',
        width: 'min(520px, calc(100vw - 24px))',
        transform: 'translateX(-50%)',
        padding: '12px 14px',
        background: '#090911',
      }}
    >
      <strong>BATTLE LOCKED</strong>
      <div>{notice}</div>
    </aside>
  )
}
