import { useCallback, useEffect, useRef, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'

export const ENCOUNTER_CUE_DURATION_MS = 420

export function useEncounterCue() {
  const [encounterCueActive, setEncounterCueActive] = useState(false)
  const activeRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const clearCue = useCallback(() => {
    activeRef.current = false
    setEncounterCueActive(false)
    if (typeof document !== 'undefined') {
      delete document.body.dataset.worldEncounterCue
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
    }
  }, [])

  const startEncounterCue = useCallback(
    (onComplete: () => void): boolean => {
      if (activeRef.current || typeof window === 'undefined') return false

      activeRef.current = true
      setEncounterCueActive(true)
      if (typeof document !== 'undefined') {
        document.body.dataset.worldEncounterCue = 'true'
      }
      gameAudio.playSe('encounter')

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        clearCue()
        onComplete()
      }, ENCOUNTER_CUE_DURATION_MS)
      return true
    },
    [clearCue],
  )

  return { encounterCueActive, startEncounterCue }
}