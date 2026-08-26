import { useEffect, useState } from 'react'
import { gameAudio, type AudioSettings } from './gameAudio'

function toPercent(value: number) {
  return Math.round(value * 100)
}

export function AudioControls() {
  const [settings, setSettings] = useState<AudioSettings>(() => gameAudio.getSettings())
  const [open, setOpen] = useState(false)

  useEffect(() => {
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

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const update = (next: AudioSettings) => {
    const normalized = gameAudio.setSettings(next)
    setSettings(normalized)
    return normalized
  }

  const toggleMute = () => {
    const next = update({ ...settings, muted: !settings.muted })
    if (!next.muted) gameAudio.playSe('confirm')
  }

  return (
    <aside className="audio-controls" aria-label="Audio settings">
      <button
        type="button"
        className="audio-settings-toggle pixel-window"
        aria-expanded={open}
        aria-controls="audio-settings-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">⚙</span>
        <strong>SOUND</strong>
      </button>

      {open && (
        <div className="audio-settings-overlay" onClick={() => setOpen(false)}>
          <section
            id="audio-settings-panel"
            className="audio-settings-panel pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="Sound settings"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>SOUND</h2>
              <button type="button" aria-label="Close sound settings" onClick={() => setOpen(false)}>
                ×
              </button>
            </header>

            <button
              type="button"
              className={`audio-toggle ${settings.muted ? 'muted' : ''}`}
              onClick={toggleMute}
              aria-pressed={settings.muted}
            >
              {settings.muted ? 'SOUND OFF' : 'SOUND ON'}
            </button>

            <label className="audio-slider">
              <span>SE {toPercent(settings.seVolume)}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={toPercent(settings.seVolume)}
                onChange={(event) =>
                  update({ ...settings, seVolume: Number(event.target.value) / 100 })
                }
                aria-label="Sound effect volume"
              />
            </label>

            <label className="audio-slider">
              <span>BGM {toPercent(settings.bgmVolume)}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={toPercent(settings.bgmVolume)}
                onChange={(event) =>
                  update({ ...settings, bgmVolume: Number(event.target.value) / 100 })
                }
                aria-label="Background music volume"
              />
            </label>
          </section>
        </div>
      )}
    </aside>
  )
}
