import { useEffect, useState } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { isTypeScriptRegionUnlocked, shouldBlockTypeScriptRegionMove } from './regionAccess'

const LOCKED_MESSAGE =
  'TYPESCRIPT FRONTIER LOCKED // まずJavaScript地方のCode Coreを止めよう。Final Bossを倒すと東へ進める。'

export function TypeScriptRegionGate() {
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const [message, setMessage] = useState<string | null>(null)
  const unlocked = isTypeScriptRegionUnlocked(progress)

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined' || unlocked) return

    const blockAttempt = (event: Event) => {
      if (window.location.pathname !== '/world') return false
      if (
        !shouldBlockTypeScriptRegionMove(
          rpgState.worldMapId,
          rpgState.worldPosition.x,
          rpgState.worldPosition.x + 1,
          progress,
        )
      ) {
        return false
      }

      event.preventDefault()
      event.stopPropagation()
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation()
      setMessage(LOCKED_MESSAGE)
      return true
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'arrowright' || key === 'd') blockAttempt(event)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('button[aria-label="Move right"]')) blockAttempt(event)
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [progress, rpgState.worldMapId, rpgState.worldPosition.x, unlocked])

  if (!message || unlocked) return null

  return (
    <aside className="pixel-window world-region-gate-message" role="status" aria-live="polite">
      {message}
    </aside>
  )
}
