import { useState } from 'react'
import { gameAudio, type AudioSettings } from './gameAudio'

function toPercent(value: number) {
  return Math.round(value * 100)
}

export function AudioControls() {
  const [settings, setSettings] = useState<AudioSettings>(() => gameAudio.getSettings())

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
    <aside className="audio-controls pixel-inner-window" aria-label="Audio controls">
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
    </aside>
  )
}
