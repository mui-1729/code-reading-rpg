import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { resolveWorldInteraction, resolveWorldMove } from './worldActions'
import type { WorldMapId } from './worldMap'

type TransitionPhase = 'covering' | 'revealing'

type ActiveTransition = {
  phase: TransitionPhase
  fromMapId: WorldMapId
  toMapId: WorldMapId
  label: string
}

type Direction = { dx: number; dy: number }

type HeldDirection = Direction & { button: HTMLButtonElement }

const DIRECTION_BY_LABEL: Record<string, Direction> = {
  '上へ移動': { dx: 0, dy: -1 },
  '下へ移動': { dx: 0, dy: 1 },
  '左へ移動': { dx: -1, dy: 0 },
  '右へ移動': { dx: 1, dy: 0 },
}

const NORMAL_COVER_MS = 180
const NORMAL_REVEAL_MS = 220
const REDUCED_COVER_MS = 24
const REDUCED_REVEAL_MS = 70
const TRANSITION_WATCHDOG_MS = 1_200

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function stopNativeEvent(event: Event) {
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

function getDirectionButton(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const button = target.closest<HTMLButtonElement>('.world-dpad button[aria-label]')
  if (!button) return null
  const label = button.getAttribute('aria-label') ?? ''
  const direction = DIRECTION_BY_LABEL[label]
  return direction ? { button, direction } : null
}

function isWorldInteractButton(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLButtonElement>('.world-interact')
    : null
}

/**
 * Portal authority stays in worldActions. This component only gates the native
 * control event when that resolver says the next action crosses a map boundary:
 * cover the old map -> replay the original control -> reveal the new map.
 */
export function WorldMapTransitionGate() {
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const [transition, setTransition] = useState<ActiveTransition | null>(null)
  const transitionRef = useRef<ActiveTransition | null>(null)
  const replayRef = useRef<(() => void) | null>(null)
  const bypassRef = useRef(false)
  const heldDirectionRef = useRef<HeldDirection | null>(null)
  const progressRef = useRef(progress)
  const rpgStateRef = useRef(rpgState)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    rpgStateRef.current = rpgState
  }, [rpgState])

  const finishTransition = useCallback(() => {
    transitionRef.current = null
    replayRef.current = null
    heldDirectionRef.current = null
    setTransition(null)
    if (typeof document !== 'undefined') delete document.body.dataset.worldTransitioning
  }, [])

  const beginTransition = useCallback((
    toMapId: WorldMapId,
    label: string,
    replay: () => void,
  ) => {
    if (transitionRef.current) return false
    const next: ActiveTransition = {
      phase: 'covering',
      fromMapId: rpgStateRef.current.worldMapId,
      toMapId,
      label,
    }
    transitionRef.current = next
    replayRef.current = replay
    heldDirectionRef.current = null
    document.body.dataset.worldTransitioning = 'true'
    setTransition(next)
    return true
  }, [])

  const tryMoveTransition = useCallback((
    dx: number,
    dy: number,
    replay: () => void,
  ) => {
    const result = resolveWorldMove({
      rpgState: rpgStateRef.current,
      progress: progressRef.current,
      dx,
      dy,
    })
    if (result.kind !== 'transition') return false
    return beginTransition(result.toMapId, result.label, replay)
  }, [beginTransition])

  const tryInteractTransition = useCallback((replay: () => void) => {
    const intent = resolveWorldInteraction(rpgStateRef.current, progressRef.current)
    if (intent.kind !== 'map-transition') return false
    return beginTransition(intent.toMapId, intent.label, replay)
  }, [beginTransition])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (bypassRef.current) return
      if (transitionRef.current) {
        if (event.target instanceof Element && event.target.closest('.world-controls, .pause-trigger')) {
          stopNativeEvent(event)
        }
        return
      }

      const control = getDirectionButton(event.target)
      if (!control || event.button !== 0) return
      const { button, direction } = control
      const replay = () => button.click()
      if (tryMoveTransition(direction.dx, direction.dy, replay)) {
        stopNativeEvent(event)
        return
      }
      heldDirectionRef.current = { button, ...direction }
    }

    const onPointerEnd = () => {
      heldDirectionRef.current = null
    }

    const onClick = (event: MouseEvent) => {
      if (bypassRef.current) return
      const directionControl = getDirectionButton(event.target)
      const interactButton = isWorldInteractButton(event.target)

      if (transitionRef.current) {
        if (directionControl || interactButton || (event.target instanceof Element && event.target.closest('.pause-trigger'))) {
          stopNativeEvent(event)
        }
        return
      }

      // Pointer D-pad movement already belongs to onPointerDown. A detail=0
      // click is keyboard/programmatic activation and is the only click path
      // WorldControls itself treats as a movement step.
      if (directionControl && event.detail === 0) {
        const { button, direction } = directionControl
        if (tryMoveTransition(direction.dx, direction.dy, () => button.click())) {
          stopNativeEvent(event)
        }
        return
      }

      if (interactButton && tryInteractTransition(() => interactButton.click())) {
        stopNativeEvent(event)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (bypassRef.current) return
      const target = event.target
      const nativeControl = target instanceof Element &&
        (event.key === 'Enter' || event.key === ' ') &&
        Boolean(target.closest('button, a'))
      if (nativeControl) return

      const key = event.key.toLowerCase()
      const direction = key === 'arrowup' || key === 'w'
        ? { dx: 0, dy: -1 }
        : key === 'arrowdown' || key === 's'
          ? { dx: 0, dy: 1 }
          : key === 'arrowleft' || key === 'a'
            ? { dx: -1, dy: 0 }
            : key === 'arrowright' || key === 'd'
              ? { dx: 1, dy: 0 }
              : null
      const interactionKey = event.key === 'Enter' || event.key === ' '

      if (transitionRef.current) {
        if (direction || interactionKey) stopNativeEvent(event)
        return
      }

      const replay = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: event.key,
          code: event.code,
          bubbles: true,
          cancelable: true,
        }))
      }

      if (direction && tryMoveTransition(direction.dx, direction.dy, replay)) {
        stopNativeEvent(event)
      } else if (interactionKey && tryInteractTransition(replay)) {
        stopNativeEvent(event)
      }
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointerup', onPointerEnd, true)
    window.addEventListener('pointercancel', onPointerEnd, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointerup', onPointerEnd, true)
      window.removeEventListener('pointercancel', onPointerEnd, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [tryInteractTransition, tryMoveTransition])

  // D-pad hold repeats inside WorldControls without another DOM event. When a
  // repeat lands one tile before a portal, stop the hold before its next tick
  // and hand that final boundary step to the same transition sequence.
  useEffect(() => {
    const held = heldDirectionRef.current
    if (!held || transitionRef.current) return
    const result = resolveWorldMove({
      rpgState,
      progress,
      dx: held.dx,
      dy: held.dy,
    })
    if (result.kind !== 'transition') return

    held.button.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      button: 0,
      pointerType: 'mouse',
    }))
    beginTransition(result.toMapId, result.label, () => held.button.click())
  }, [beginTransition, progress, rpgState])

  useEffect(() => {
    if (!transition || transition.phase !== 'covering') return
    const delay = prefersReducedMotion() ? REDUCED_COVER_MS : NORMAL_COVER_MS
    const timer = window.setTimeout(() => {
      const replay = replayRef.current
      replayRef.current = null
      if (!replay) return
      bypassRef.current = true
      try {
        replay()
      } finally {
        bypassRef.current = false
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [transition])

  useEffect(() => {
    if (!transition || transition.phase !== 'covering') return
    if (rpgState.worldMapId !== transition.toMapId) return
    const next = { ...transition, phase: 'revealing' as const }
    transitionRef.current = next
    setTransition(next)
  }, [rpgState.worldMapId, transition])

  useEffect(() => {
    if (!transition || transition.phase !== 'revealing') return
    const delay = prefersReducedMotion() ? REDUCED_REVEAL_MS : NORMAL_REVEAL_MS
    const timer = window.setTimeout(finishTransition, delay)
    return () => window.clearTimeout(timer)
  }, [finishTransition, transition])

  useEffect(() => {
    if (!transition) return
    const timer = window.setTimeout(finishTransition, TRANSITION_WATCHDOG_MS)
    return () => window.clearTimeout(timer)
  }, [finishTransition, transition])

  useEffect(() => () => {
    delete document.body.dataset.worldTransitioning
  }, [])

  if (!transition) return null

  return (
    <div
      className="world-map-transition"
      data-world-transition-phase={transition.phase}
      data-world-transition-from={transition.fromMapId}
      data-world-transition-to={transition.toMapId}
      aria-hidden="true"
    >
      <span className="world-map-transition-vortex" />
    </div>
  )
}
