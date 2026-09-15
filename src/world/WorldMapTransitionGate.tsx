import { useCallback, useEffect, useRef } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { useSceneTransition } from '../transition/SceneTransitionContext'
import { resolveWorldMove } from './worldActions'
import { getWorldInteractionTarget } from './worldInteractionTarget'
import type { WorldFacing } from './worldPresentation'
import type { WorldMapId } from './worldMap'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

type Direction = { dx: number; dy: number }
type HeldDirection = Direction & { button: HTMLButtonElement }

const DIRECTION_BY_LABEL: Record<string, Direction> = {
  '上へ移動': { dx: 0, dy: -1 },
  '下へ移動': { dx: 0, dy: 1 },
  '左へ移動': { dx: -1, dy: 0 },
  '右へ移動': { dx: 1, dy: 0 },
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

function getRenderedWorldFacing(): WorldFacing | null {
  const facing = document.querySelector<HTMLElement>('.world-player-sprite')?.dataset.facing
  return facing === 'up' || facing === 'down' || facing === 'left' || facing === 'right'
    ? facing
    : null
}

/**
 * Portal authority stays in the exact-target interaction resolver. This gate
 * only identifies map-boundary actions and hands their timing/input lock to
 * the shared scene-transition engine.
 */
export function WorldMapTransitionGate() {
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const { isTransitioning, runSceneTransition } = useSceneTransition()
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

  const beginTransition = useCallback((
    toMapId: WorldMapId,
    label: string,
    replay: () => void,
  ) => {
    if (isTransitioning) return false
    heldDirectionRef.current = null
    void runSceneTransition(
      'map',
      () => {
        bypassRef.current = true
        try {
          replay()
        } finally {
          bypassRef.current = false
        }
      },
      {
        label,
        waitFor: () => rpgStateRef.current.worldMapId === toMapId,
      },
    )
    return true
  }, [isTransitioning, runSceneTransition])

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
    const facing = getRenderedWorldFacing()
    if (!facing) return false
    const target = getWorldInteractionTarget(rpgStateRef.current.worldPosition, facing)
    const intent = resolveWorldTargetInteraction(rpgStateRef.current, progressRef.current, target)
    if (intent.kind !== 'map-transition') return false
    return beginTransition(intent.toMapId, intent.label, replay)
  }, [beginTransition])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (bypassRef.current) return
      if (isTransitioning) {
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

      if (isTransitioning) {
        if (directionControl || interactButton || (event.target instanceof Element && event.target.closest('.pause-trigger'))) {
          stopNativeEvent(event)
        }
        return
      }

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

      if (isTransitioning) {
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
  }, [isTransitioning, tryInteractTransition, tryMoveTransition])

  // D-pad hold repeats inside WorldControls without another DOM event. Stop the
  // hold before its next tick and let the shared transition own the boundary.
  useEffect(() => {
    const held = heldDirectionRef.current
    if (!held || isTransitioning) return
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
  }, [beginTransition, isTransitioning, progress, rpgState])

  return null
}
