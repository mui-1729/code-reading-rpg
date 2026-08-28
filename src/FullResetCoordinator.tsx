import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { RPG_STORAGE_KEY } from './rpg'
import { JAVASCRIPT_OPENING_STORAGE_KEY } from './story/javascriptOpening'
import { TUTORIAL_STORAGE_KEY } from './tutorial/storage'

const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

export function FullResetCoordinator() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleReset = () => {
      try {
        window.localStorage.removeItem(JAVASCRIPT_OPENING_STORAGE_KEY)
        window.localStorage.removeItem(RPG_STORAGE_KEY)
        window.localStorage.removeItem(TUTORIAL_STORAGE_KEY)
      } catch {
        // In-memory providers still reset through the same event when storage is unavailable.
      }

      navigate({ to: '/', replace: true })
    }

    window.addEventListener(PROGRESS_RESET_EVENT, handleReset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, handleReset)
  }, [navigate])

  return null
}
