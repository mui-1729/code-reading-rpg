import { useEffect } from 'react'
import { readStoredAudioSettings } from './audioSettingsStorage'
import { gameAudio } from './gameAudio'

export function AudioUnlock() {
  useEffect(() => {
    gameAudio.setSettings(readStoredAudioSettings())

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlockFromGesture, true)
      window.removeEventListener('touchstart', unlockFromGesture, true)
      window.removeEventListener('keydown', unlockFromGesture, true)
    }

    const unlockFromGesture = () => {
      removeUnlockListeners()
      void gameAudio.unlock().catch(() => undefined)
    }

    window.addEventListener('pointerdown', unlockFromGesture, { capture: true, once: true })
    window.addEventListener('touchstart', unlockFromGesture, { capture: true, once: true, passive: true })
    window.addEventListener('keydown', unlockFromGesture, { capture: true, once: true })

    return removeUnlockListeners
  }, [])

  return null
}
