import { useEffect } from 'react'
import { useQueuedWorldMove } from './useQueuedWorldMove'

export function useWorldKeyboardControls(options: {
  move: (dx: number, dy: number) => void
  interact: () => void
  disabled?: boolean
}) {
  const { disabled = false, interact, move } = options
  const queuedMove = useQueuedWorldMove(move, disabled)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        disabled ||
        event.defaultPrevented ||
        document.body.dataset.rpgPaused === 'true' ||
        Boolean(document.body.dataset.worldEncounterCue)
      ) return
      // Native controls own Enter/Space; do not also interact with the map behind them.
      const target = event.target
      if (target instanceof Element) {
        if (target.closest('input, select, textarea, [contenteditable="true"]')) return
        if ((event.key === 'Enter' || event.key === ' ') && target.closest('button, a')) return
      }
      const key = event.key.toLowerCase()
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        queuedMove(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        queuedMove(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        queuedMove(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        queuedMove(1, 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const actionButton = document.querySelector<HTMLButtonElement>('.world-interact:not(:disabled)')
        if (actionButton) actionButton.click()
        else interact()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, interact, queuedMove])
}
