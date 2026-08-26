import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AUDIO_SETTINGS,
  getChannelVolume,
  normalizeAudioSettings,
} from './gameAudio'

describe('game audio settings', () => {
  it('音量を0〜1へ正規化する', () => {
    expect(
      normalizeAudioSettings({
        muted: false,
        seVolume: -0.4,
        bgmVolume: 1.8,
      }),
    ).toEqual({
      muted: false,
      seVolume: 0,
      bgmVolume: 1,
    })
  })

  it('mute中はSE/BGMの両channelを0にする', () => {
    const muted = { ...DEFAULT_AUDIO_SETTINGS, muted: true }

    expect(getChannelVolume(muted, 'se')).toBe(0)
    expect(getChannelVolume(muted, 'bgm')).toBe(0)
  })

  it('mute解除中はSE/BGMを別音量として扱う', () => {
    const settings = { muted: false, seVolume: 0.7, bgmVolume: 0.2 }

    expect(getChannelVolume(settings, 'se')).toBe(0.7)
    expect(getChannelVolume(settings, 'bgm')).toBe(0.2)
  })
})
