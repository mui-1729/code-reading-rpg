import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ProgressContext } from './ProgressContext'
import { createInitialPlayerProgress, getPlayerStats } from './progression'
import {
  PLAYER_PROGRESS_STORAGE_KEY,
  restorePlayerProgress,
  serializePlayerProgress,
} from './storage'

type ProgressProviderProps = {
  children: ReactNode
}

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

function loadInitialProgress() {
  if (typeof window === 'undefined') return createInitialPlayerProgress()

  try {
    return restorePlayerProgress(window.localStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY))
  } catch {
    return createInitialPlayerProgress()
  }
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useState(loadInitialProgress)
  const stats = useMemo(() => getPlayerStats(progress.exp), [progress.exp])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        PLAYER_PROGRESS_STORAGE_KEY,
        serializePlayerProgress(progress),
      )
    } catch {
      // Storage unavailable: keep the in-memory progress usable for this session.
    }
  }, [progress])

  const resetProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(PLAYER_PROGRESS_STORAGE_KEY)
      } catch {
        // Ignore storage failures; resetting in-memory state still works.
      }
      window.dispatchEvent(new Event(PROGRESS_RESET_EVENT))
    }

    setProgress(createInitialPlayerProgress())
  }, [])

  const value = useMemo(
    () => ({ progress, stats, setProgress, resetProgress }),
    [progress, resetProgress, stats],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
