import { describe, expect, it } from 'vitest'
import {
  BGM_PATTERNS,
  BGM_TRACKS,
  DEFAULT_AUDIO_SETTINGS,
  getChannelVolume,
  normalizeAudioSettings,
  shouldReleaseBgm,
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

describe('game BGM', () => {
  it('menu / field / battleの3trackに再生patternがある', () => {
    expect(BGM_TRACKS).toEqual(['menu', 'field', 'battle'])

    for (const track of BGM_TRACKS) {
      const pattern = BGM_PATTERNS[track]
      expect(pattern.notes.length).toBeGreaterThan(0)
      expect(pattern.stepMs).toBeGreaterThan(100)
      expect(pattern.noteMs).toBeLessThanOrEqual(pattern.stepMs)
      expect(pattern.volume).toBeGreaterThan(0)
    }
  })

  it('現在request中のtrackだけがcleanupで停止できる', () => {
    expect(shouldReleaseBgm('battle', 'battle')).toBe(true)
    expect(shouldReleaseBgm('field', 'battle')).toBe(false)
    expect(shouldReleaseBgm('menu', 'field')).toBe(false)
    expect(shouldReleaseBgm(null, 'menu')).toBe(false)
  })

  it('default BGM volumeは実機で聞き取れる余裕を持たせる', () => {
    expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBeGreaterThanOrEqual(0.25)
    expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBeLessThan(DEFAULT_AUDIO_SETTINGS.seVolume)
  })
})
