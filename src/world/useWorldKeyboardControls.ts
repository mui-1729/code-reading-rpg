import { useEffect } from 'react'

export function useWorldKeyboardControls(options: {
  move: (dx: number, dy: number) => void
  interact: () => void
  disabled?: boolean
}) {
  const { disabled = false, interact, move } = options

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (disabled || event.defaultPrevented || document.body.dataset.rpgPaused === 'true') return
      // Native controls own Enter/Space; do not also interact with the map behind them.
      const target = event.target
      if (target instanceof Element) {
        if (target.closest('input, select, textarea, [contenteditable="true"]')) return
        if ((event.key === 'Enter' || event.key === ' ') && target.closest('button, a')) return
      }
      const key = event.key.toLowerCase()
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        move(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        move(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        move(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        move(1, 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        interact()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, interact, move])
}
