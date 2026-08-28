import { useEffect } from 'react'
import { resetGameToTitle } from './fullReset'

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

export function FullResetCoordinator() {
  useEffect(() => {
    const handleReset = () => resetGameToTitle()

    window.addEventListener(PROGRESS_RESET_EVENT, handleReset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, handleReset)
  }, [])

  return null
}
