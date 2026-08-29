import { useEffect, useState } from 'react'
import { useProgress } from '../progression'
import { getBattleRouteLockReason, isBattleRouteUnlocked, type BattleRouteArea } from './battleRouteAccess'

const FLASH_KEY = 'code-reading-rpg:battle-route-lock'
const BATTLE_PATH = /^\/(javascript|typescript)\/battle\/(\d+)$/

type RouteSnapshot = {
  pathname: string
  hash: string
}

function readRoute(): RouteSnapshot {
  return { pathname: window.location.pathname, hash: window.location.hash }
}

export function BattleRouteGate() {
  const { progress } = useProgress()
  const [route, setRoute] = useState<RouteSnapshot>(() => readRoute())
  const [notice, setNotice] = useState<string | null>(() =>
    window.location.hash === '#battle-locked' ? window.sessionStorage.getItem(FLASH_KEY) : null,
  )

  useEffect(() => {
    const sync = () => setRoute(readRoute())
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('popstate', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    const match = BATTLE_PATH.exec(route.pathname)
    if (!match) {
      if (route.pathname === '/world' && route.hash === '#battle-locked') {
        setNotice(window.sessionStorage.getItem(FLASH_KEY))
      }
      return
    }

    const area = match[1] as BattleRouteArea
    const battleId = Number(match[2])
    if (isBattleRouteUnlocked(area, battleId, progress)) return

    const reason = getBattleRouteLockReason(area, battleId)
    window.sessionStorage.setItem(FLASH_KEY, reason)
    window.location.replace('/world#battle-locked')
  }, [progress, route.hash, route.pathname])

  if (route.pathname !== '/world' || route.hash !== '#battle-locked' || !notice) return null

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
