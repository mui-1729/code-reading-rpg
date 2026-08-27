import {
  DEFAULT_AUDIO_SETTINGS,
  normalizeAudioSettings,
  type AudioSettings,
} from './gameAudio'

export const AUDIO_SETTINGS_STORAGE_KEY = 'code-reading-rpg:audio-settings'
export const AUDIO_SETTINGS_SCHEMA_VERSION = 1

type StoredAudioSettings = {
  version: typeof AUDIO_SETTINGS_SCHEMA_VERSION
  settings: AudioSettings
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function restoreAudioSettings(raw: string | null): AudioSettings {
  if (raw === null) return { ...DEFAULT_AUDIO_SETTINGS }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_AUDIO_SETTINGS }
    }

    const stored = parsed as Partial<StoredAudioSettings>
    const settings = stored.settings
    if (
      stored.version !== AUDIO_SETTINGS_SCHEMA_VERSION ||
      !settings ||
      typeof settings.muted !== 'boolean' ||
      !isFiniteNumber(settings.seVolume) ||
      !isFiniteNumber(settings.bgmVolume)
    ) {
      return { ...DEFAULT_AUDIO_SETTINGS }
    }

    return normalizeAudioSettings(settings)
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

export function serializeAudioSettings(settings: AudioSettings): string {
  const stored: StoredAudioSettings = {
    version: AUDIO_SETTINGS_SCHEMA_VERSION,
    settings: normalizeAudioSettings(settings),
  }
  return JSON.stringify(stored)
}

export function readStoredAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_AUDIO_SETTINGS }

  try {
    return restoreAudioSettings(window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY))
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

export function writeStoredAudioSettings(settings: AudioSettings): AudioSettings {
  const normalized = normalizeAudioSettings(settings)
  if (typeof window === 'undefined') return normalized

  try {
    window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, serializeAudioSettings(normalized))
  } catch {
    // Storage may be unavailable (private mode / quota). Audio still works for this session.
  }

  return normalized
}
