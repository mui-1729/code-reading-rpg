import { useEffect, useRef } from 'react'
import { useSceneTransition } from './useSceneTransition'

function stopNativeEvent(event: Event) {
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function HomeSceneTransitionGate() {
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  const bypassRef = useRef(false)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (bypassRef.current || isTransitioning) return
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLButtonElement>('button')
      if (!button) return

      const replay = () => {
        bypassRef.current = true
        try {
          button.click()
        } finally {
          bypassRef.current = false
        }
      }

      const isContinue = Boolean(button.closest('.title-menu')) && button.textContent?.includes('続きから')
      if (isContinue) {
        stopNativeEvent(event)
        void runSceneTransition('connect', replay, { label: 'CONNECT // CODE WORLD' })
        return
      }

      if (!button.closest('.opening-actions')) return

      const text = button.textContent ?? ''
      const currentLayer = document.querySelector<HTMLElement>('.opening-scene')?.dataset.storyLayer
      const isStoryExit = text.includes('CODE WORLDを探索する') || text.includes('スキップ')
      if (isStoryExit) {
        stopNativeEvent(event)
        const exitsFromRealWorld = currentLayer === 'real-world'
        void runSceneTransition(
          exitsFromRealWorld ? 'connect' : 'story-to-world',
          replay,
          { label: exitsFromRealWorld ? 'CONNECT // CODE WORLD' : 'MISSION START' },
        )
        return
      }

      const systemLine = document.querySelector<HTMLElement>('.opening-system-line')?.textContent ?? ''
      const entersConnectLayer = button.classList.contains('primary-button') && systemLine.includes('INCIDENT')
      if (entersConnectLayer) {
        stopNativeEvent(event)
        void runSceneTransition('connect', replay, { label: 'CONNECT // CODE WORLD' })
      }
    }

    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [isTransitioning, runSceneTransition])

  return null
}
