import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { gameAudio, type SoundEffect } from '../audio/gameAudio'

export type SceneTransitionKind =
  | 'map'
  | 'encounter'
  | 'battle-start'
  | 'boss-start'
  | 'battle-return'
  | 'defeat-return'
  | 'connect'
  | 'return-real-world'
  | 'story-to-world'

type SceneTransitionPhase = 'covering' | 'revealing'

type ActiveSceneTransition = {
  kind: SceneTransitionKind
  phase: SceneTransitionPhase
  label?: string
}

type SceneTransitionOptions = {
  label?: string
  waitFor?: () => boolean
}

type SceneTransitionContextValue = {
  isTransitioning: boolean
  runSceneTransition: (
    kind: SceneTransitionKind,
    swap: () => void | Promise<void>,
    options?: SceneTransitionOptions,
  ) => Promise<boolean>
}

type TransitionTiming = {
  coverMs: number
  revealMs: number
  se: SoundEffect | null
}

const NORMAL_TIMINGS: Record<SceneTransitionKind, TransitionTiming> = {
  map: { coverMs: 180, revealMs: 220, se: 'mapEnter' },
  encounter: { coverMs: 150, revealMs: 190, se: null },
  'battle-start': { coverMs: 180, revealMs: 220, se: 'battleStart' },
  'boss-start': { coverMs: 250, revealMs: 260, se: 'battleStart' },
  'battle-return': { coverMs: 150, revealMs: 220, se: 'battleReturn' },
  'defeat-return': { coverMs: 220, revealMs: 260, se: 'battleReturn' },
  connect: { coverMs: 260, revealMs: 300, se: 'connect' },
  'return-real-world': { coverMs: 240, revealMs: 280, se: 'worldReturn' },
  'story-to-world': { coverMs: 170, revealMs: 220, se: 'mapEnter' },
}

const REDUCED_TIMING = { coverMs: 24, revealMs: 70 }
const SCENE_SWAP_WATCHDOG_MS = 1_200

const SceneTransitionContext = createContext<SceneTransitionContextValue | null>(null)

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function waitUntil(predicate: () => boolean) {
  const startedAt = performance.now()
  while (!predicate() && performance.now() - startedAt < SCENE_SWAP_WATCHDOG_MS) {
    await nextFrame()
  }
}

function stopTrustedInput(event: Event) {
  if (!event.isTrusted) return
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function SceneTransitionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveSceneTransition | null>(null)
  const activeRef = useRef<ActiveSceneTransition | null>(null)

  const finish = useCallback(() => {
    activeRef.current = null
    setActive(null)
    if (typeof document !== 'undefined') {
      delete document.body.dataset.sceneTransitioning
      delete document.body.dataset.sceneTransitionKind
      delete document.body.dataset.worldTransitioning
    }
  }, [])

  const runSceneTransition = useCallback<SceneTransitionContextValue['runSceneTransition']>(async (
    kind,
    swap,
    options = {},
  ) => {
    if (activeRef.current || typeof window === 'undefined') return false

    const reduced = prefersReducedMotion()
    const baseTiming = NORMAL_TIMINGS[kind]
    const timing = reduced
      ? { ...baseTiming, ...REDUCED_TIMING }
      : baseTiming
    const covering: ActiveSceneTransition = { kind, phase: 'covering', label: options.label }

    activeRef.current = covering
    setActive(covering)
    document.body.dataset.sceneTransitioning = 'true'
    document.body.dataset.sceneTransitionKind = kind
    if (kind === 'map') document.body.dataset.worldTransitioning = 'true'
    if (timing.se) gameAudio.playSe(timing.se)

    try {
      await delay(timing.coverMs)
      await swap()
      if (options.waitFor) await waitUntil(options.waitFor)
      await nextFrame()

      const revealing: ActiveSceneTransition = { ...covering, phase: 'revealing' }
      activeRef.current = revealing
      setActive(revealing)
      await delay(timing.revealMs)
      finish()
      return true
    } catch (error) {
      finish()
      throw error
    }
  }, [finish])

  useEffect(() => {
    if (!active) return
    const block = (event: Event) => stopTrustedInput(event)
    window.addEventListener('pointerdown', block, true)
    window.addEventListener('click', block, true)
    window.addEventListener('keydown', block, true)
    return () => {
      window.removeEventListener('pointerdown', block, true)
      window.removeEventListener('click', block, true)
      window.removeEventListener('keydown', block, true)
    }
  }, [active])

  useEffect(() => finish, [finish])

  const value = useMemo(() => ({
    isTransitioning: active !== null,
    runSceneTransition,
  }), [active, runSceneTransition])

  return (
    <SceneTransitionContext.Provider value={value}>
      {children}
      {active && (
        <div
          className={`scene-transition ${active.kind === 'map' ? 'world-map-transition' : ''}`}
          data-scene-transition-kind={active.kind}
          data-scene-transition-phase={active.phase}
          data-world-transition-phase={active.kind === 'map' ? active.phase : undefined}
          aria-hidden="true"
        >
          <span className="scene-transition-mark world-map-transition-vortex" />
        </div>
      )}
    </SceneTransitionContext.Provider>
  )
}

export function useSceneTransition() {
  const value = useContext(SceneTransitionContext)
  if (!value) throw new Error('useSceneTransition must be used within SceneTransitionProvider')
  return value
}
