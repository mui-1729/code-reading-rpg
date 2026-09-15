import { useEffect, useRef } from 'react'
import { useSceneTransition } from './useSceneTransition'

function getResultReturn(button: HTMLButtonElement) {
  const label = button.textContent ?? ''
  if (button.closest('.defeat-actions') && label.includes('チェックポイントへ戻る')) {
    return { kind: 'defeat-return' as const, label: '安全な拠点へ戻る' }
  }
  if (button.closest('.result-actions') && label.includes('ワールドへ戻る')) {
    return { kind: 'battle-return' as const, label: 'ワールドへ戻る' }
  }
  return null
}

/**
 * Battle result handlers own commit/rollback, confirm SE, and navigation. This
 * gate delays the original click until the shared scene cover is opaque so
 * Battle -> World never becomes a naked route swap without duplicating sound.
 */
export function BattleResultTransitionGate() {
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  const bypassRef = useRef(false)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (bypassRef.current || isTransitioning) return
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLButtonElement>('button')
      if (!button || button.disabled) return
      const transition = getResultReturn(button)
      if (!transition) return

      if (event.cancelable) event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      void runSceneTransition(
        transition.kind,
        () => {
          bypassRef.current = true
          try {
            button.click()
          } finally {
            bypassRef.current = false
          }
        },
        {
          label: transition.label,
          playSound: false,
        },
      )
    }

    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [isTransitioning, runSceneTransition])

  return null
}
