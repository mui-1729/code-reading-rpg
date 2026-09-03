import { useCallback, useEffect, useRef } from 'react'
import { WORLD_STEP_MS } from './worldPresentation'

type WorldMove = (dx: number, dy: number) => void
type QueuedStep = { dx: number; dy: number }

const MAX_QUEUED_WORLD_STEPS = 8
// The queue timer is registered before React commits the camera-pan timer.
// If both expire at exactly WORLD_STEP_MS, the next logical move can run first
// and interrupt the previous visual transaction. Leave one frame for the pan
// cleanup to commit before handing the next step to WorldScene.
const WORLD_STEP_HANDOFF_MS = 16

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getWorldStepDelay() {
  return prefersReducedMotion() ? 0 : WORLD_STEP_MS + WORLD_STEP_HANDOFF_MS
}

export function useQueuedWorldMove(move: WorldMove, disabled = false) {
  const moveRef = useRef(move)
  const queueRef = useRef<QueuedStep[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disabledRef = useRef(disabled)

  useEffect(() => {
    moveRef.current = move
  }, [move])

  useEffect(() => {
    disabledRef.current = disabled
    if (!disabled) return
    queueRef.current = []
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [disabled])

  const processNext = useCallback(function processNextStep() {
    timerRef.current = null
    if (disabledRef.current) {
      queueRef.current = []
      return
    }

    const next = queueRef.current.shift()
    if (!next) return

    moveRef.current(next.dx, next.dy)
    timerRef.current = setTimeout(processNextStep, getWorldStepDelay())
  }, [])

  useEffect(() => () => {
    queueRef.current = []
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  return useCallback((dx: number, dy: number) => {
    if (disabledRef.current) return

    if (timerRef.current === null && queueRef.current.length === 0) {
      moveRef.current(dx, dy)
      timerRef.current = setTimeout(processNext, getWorldStepDelay())
      return
    }

    if (queueRef.current.length < MAX_QUEUED_WORLD_STEPS) {
      queueRef.current.push({ dx, dy })
    }
  }, [processNext])
}
