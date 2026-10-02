import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { SceneTransitionContext, type SceneTransitionContextValue, type SceneTransitionKind } from './sceneTransitionState'
import { getSceneTransitionTiming } from './sceneTransitionTiming'

type ActiveSceneTransition = {
  kind: SceneTransitionKind
  phase: 'alert' | 'covering' | 'revealing'
  fromMapId?: string
  toMapId?: string
  coverMs: number
  revealMs: number
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Transition cancelled', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}

function clearInputLock() {
  delete document.body.dataset.sceneTransitioning
  delete document.body.dataset.sceneTransitionKind
  delete document.body.dataset.worldTransitioning
  delete document.body.dataset.worldEncounterCue
}

export function SceneTransitionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveSceneTransition | null>(null)
  const pendingRef = useRef<AbortController | null>(null)

  const runSceneTransition = useCallback<SceneTransitionContextValue['runSceneTransition']>(async (
    kind, swap, options = {},
  ) => {
    if (pendingRef.current) return false
    const pending = new AbortController()
    pendingRef.current = pending
    const { signal } = pending
    const timing = getSceneTransitionTiming(kind, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const transition: ActiveSceneTransition = {
      kind, phase: kind === 'encounter' ? 'alert' : 'covering',
      fromMapId: options.fromMapId, toMapId: options.toMapId,
      coverMs: timing.coverMs, revealMs: timing.revealMs,
    }
    document.body.dataset.sceneTransitioning = 'true'
    document.body.dataset.sceneTransitionKind = kind
    if (kind === 'map') document.body.dataset.worldTransitioning = 'true'
    setActive(transition)
    gameAudio.playSe(timing.se)

    try {
      if (kind === 'encounter') {
        document.body.dataset.worldEncounterCue = 'alert'
        await wait(timing.alertMs, signal)
        document.body.dataset.worldEncounterCue = 'transition'
        setActive({ ...transition, phase: 'covering' })
      }
      await wait(timing.coverMs, signal)
      await swap()
      if (signal.aborted) return false
      // Allow React's map/Story state update to commit before revealing. Router
      // navigation is awaited by its caller, so this also covers lazy routes.
      await wait(32, signal)
      setActive({ ...transition, phase: 'revealing' })
      await wait(timing.revealMs, signal)
      return true
    } catch (error) {
      if (!signal.aborted) throw error
      return false
    } finally {
      if (pendingRef.current === pending) {
        pendingRef.current = null
        clearInputLock()
        setActive(null)
      }
    }
  }, [])

  useEffect(() => {
    // The ref is set synchronously by the trigger. Capture input without
    // replaying native events or depending on a subsequent React effect.
    const block = (event: Event) => {
      if (!pendingRef.current) return
      if (event.cancelable) event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
    window.addEventListener('pointerdown', block, true)
    window.addEventListener('click', block, true)
    window.addEventListener('keydown', block, true)
    return () => {
      window.removeEventListener('pointerdown', block, true)
      window.removeEventListener('click', block, true)
      window.removeEventListener('keydown', block, true)
      const pending = pendingRef.current
      pendingRef.current = null
      pending?.abort()
      clearInputLock()
    }
  }, [])

  const value = useMemo(() => ({ isTransitioning: active !== null, runSceneTransition }), [active, runSceneTransition])
  return (
    <SceneTransitionContext.Provider value={value}>
      {children}
      {active && (
        <div
          className={`scene-transition ${active.kind === 'map' ? 'world-map-transition' : ''}`}
          data-scene-transition-kind={active.kind}
          data-scene-transition-phase={active.phase}
          data-world-transition-phase={active.kind === 'map' ? active.phase : undefined}
          data-world-transition-from={active.kind === 'map' ? active.fromMapId : undefined}
          data-world-transition-to={active.kind === 'map' ? active.toMapId : undefined}
          style={{ '--scene-cover-ms': `${active.coverMs}ms`, '--scene-reveal-ms': `${active.revealMs}ms` } as CSSProperties}
          aria-hidden="true"
        >
          <span className="scene-transition-mark world-map-transition-vortex" />
        </div>
      )}
    </SceneTransitionContext.Provider>
  )
}
