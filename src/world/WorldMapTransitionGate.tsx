import { useCallback, useEffect, useRef } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { useSceneTransition } from '../transition/useSceneTransition'
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

function replayPointerClick(button: HTMLButtonElement) {
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function replayKeyboard(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function getFacingForDirection(direction: Direction): WorldFacing | null {
  if (direction.dx === -1 && direction.dy === 0) return 'left'
  if (direction.dx === 1 && direction.dy === 0) return 'right'
  if (direction.dx === 0 && direction.dy === -1) return 'up'
  if (direction.dx === 0 && direction.dy === 1) return 'down'
  return null
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
    const fromMapId = rpgStateRef.current.worldMapId
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
        fromMapId,
        toMapId,
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
    if (result.kind !== 'portal') return false
    return beginTransition(result.portal.toMapId, result.portal.label, replay)
  }, [beginTransition])

  const tryInteractTransition = useCallback((replay: () => void) => {
    const state = rpgStateRef.current
    const target = getWorldInteractionTarget(state.worldMapId, state.worldPosition, state.worldFacing)
    if (!target) return false
    const result = resolveWorldTargetInteraction({
      rpgState: state,
      progress: progressRef.current,
      target,
    })
    if (result.kind !== 'portal') return false
    return beginTransition(result.portal.toMapId, result.portal.label, replay)
  }, [beginTransition])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (bypassRef.current || isTransitioning) return
      const found = getDirectionButton(event.target)
      if (!found) return
      heldDirectionRef.current = { ...found.direction, button: found.button }
    }

    const onPointerUp = () => {
      heldDirectionRef.current = null
    }

    const onClick = (event: MouseEvent) => {
      if (bypassRef.current || isTransitioning) return

      const found = getDirectionButton(event.target)
      if (found) {
        const transitioned = tryMoveTransition(
          found.direction.dx,
          found.direction.dy,
          () => replayPointerClick(found.button),
        )
        if (transitioned) stopNativeEvent(event)
        return
      }

      const interactButton = isWorldInteractButton(event.target)
      if (!interactButton) return
      const transitioned = tryInteractTransition(() => replayPointerClick(interactButton))
      if (transitioned) stopNativeEvent(event)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (bypassRef.current || isTransitioning) return
      const direction = DIRECTION_BY_LABEL[
        event.key === 'ArrowUp'
          ? '上へ移動'
          : event.key === 'ArrowDown'
            ? '下へ移動'
            : event.key === 'ArrowLeft'
              ? '左へ移動'
              : event.key === 'ArrowRight'
                ? '右へ移動'
                : ''
      ]
      if (direction) {
        const facing = getFacingForDirection(direction)
        if (!facing) return
        const transitioned = tryMoveTransition(direction.dx, direction.dy, () => replayKeyboard(event.key))
        if (transitioned) stopNativeEvent(event)
        return
      }

      if (event.key !== 'Enter' && event.key !== ' ') return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('button, input, textarea, select, a')) return
      const transitioned = tryInteractTransition(() => replayKeyboard(event.key))
      if (transitioned) stopNativeEvent(event)
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointerup', onPointerUp, true)
    window.addEventListener('pointercancel', onPointerUp, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointerup', onPointerUp, true)
      window.removeEventListener('pointercancel', onPointerUp, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [isTransitioning, tryInteractTransition, tryMoveTransition])

  return null
}
