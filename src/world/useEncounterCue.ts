import { useCallback, useEffect, useRef, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'

export const ENCOUNTER_ALERT_DURATION_MS = 260
export const ENCOUNTER_TRANSITION_DURATION_MS = 180
export const ENCOUNTER_CUE_DURATION_MS =
  ENCOUNTER_ALERT_DURATION_MS + ENCOUNTER_TRANSITION_DURATION_MS

export function useEncounterCue() {
  const [encounterCueActive, setEncounterCueActive] = useState(false)
  const activeRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const pauseTriggerRef = useRef<HTMLButtonElement | null>(null)

  const clearCue = useCallback(() => {
    activeRef.current = false
    setEncounterCueActive(false)
    if (typeof document !== 'undefined') {
      delete document.body.dataset.worldEncounterCue
    }
    if (pauseTriggerRef.current) {
      pauseTriggerRef.current.disabled = false
      pauseTriggerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      activeRef.current = false
      if (typeof document !== 'undefined') {
        delete document.body.dataset.worldEncounterCue
      }
      if (pauseTriggerRef.current) {
        pauseTriggerRef.current.disabled = false
        pauseTriggerRef.current = null
      }
    }
  }, [])

  const startEncounterCue = useCallback(
    (onComplete: () => void): boolean => {
      if (activeRef.current || typeof window === 'undefined') return false

      activeRef.current = true
      setEncounterCueActive(true)
      document.body.dataset.worldEncounterCue = 'alert'
      const pauseTrigger = document.querySelector<HTMLButtonElement>('.pause-trigger')
      if (pauseTrigger) {
        pauseTrigger.disabled = true
        pauseTriggerRef.current = pauseTrigger
      }
      gameAudio.playSe('encounter')

      timerRef.current = window.setTimeout(() => {
        document.body.dataset.worldEncounterCue = 'transition'
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null
          clearCue()
          onComplete()
        }, ENCOUNTER_TRANSITION_DURATION_MS)
      }, ENCOUNTER_ALERT_DURATION_MS)
      return true
    },
    [clearCue],
  )

  return { encounterCueActive, startEncounterCue }
}
