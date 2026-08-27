import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIO_SETTINGS } from './gameAudio'
import {
  AUDIO_SETTINGS_SCHEMA_VERSION,
  restoreAudioSettings,
  serializeAudioSettings,
} from './audioSettingsStorage'

describe('audio settings storage', () => {
  it('正規の設定をserialize / restoreできる', () => {
    const settings = { muted: true, seVolume: 0.65, bgmVolume: 0.35 }

    expect(restoreAudioSettings(serializeAudioSettings(settings))).toEqual(settings)
  })

  it('restore時にもvolumeを0〜1へclampする', () => {
    const raw = JSON.stringify({
      version: AUDIO_SETTINGS_SCHEMA_VERSION,
      settings: { muted: false, seVolume: 2, bgmVolume: -1 },
    })

    expect(restoreAudioSettings(raw)).toEqual({
      muted: false,
      seVolume: 1,
      bgmVolume: 0,
    })
  })

  it.each([
    null,
    'not-json',
    JSON.stringify({ version: 99, settings: DEFAULT_AUDIO_SETTINGS }),
    JSON.stringify({
      version: AUDIO_SETTINGS_SCHEMA_VERSION,
      settings: { muted: 'no', seVolume: 0.5, bgmVolume: 0.5 },
    }),
    JSON.stringify({
      version: AUDIO_SETTINGS_SCHEMA_VERSION,
      settings: { muted: false, seVolume: Number.NaN, bgmVolume: 0.5 },
    }),
  ])('invalid saveはdefaultへfallbackする', (raw) => {
    expect(restoreAudioSettings(raw)).toEqual(DEFAULT_AUDIO_SETTINGS)
  })
})
