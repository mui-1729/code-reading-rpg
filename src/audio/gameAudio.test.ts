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
  it('field / region field / region battle / Bossごとに再生patternを持つ', () => {
    expect(BGM_TRACKS).toEqual([
      'menu',
      'field',
      'fieldVillage',
      'fieldForest',
      'fieldDeepForest',
      'fieldTypeScript',
      'battle',
      'battleForest',
      'battleDeepForest',
      'battleTypeScript',
      'battleBoss',
      'battleJsBoss',
      'battleTsBoss',
    ])

    for (const track of BGM_TRACKS) {
      const pattern = BGM_PATTERNS[track]
      expect(pattern.notes.length).toBeGreaterThan(0)
      expect(pattern.stepMs).toBeGreaterThan(100)
      expect(pattern.noteMs).toBeLessThanOrEqual(pattern.stepMs)
      expect(pattern.volume).toBeGreaterThan(0)
    }
  })

  it('探索fieldはregionごとに同じ8音loopへfallbackしない', () => {
    const fieldTracks = [
      BGM_PATTERNS.field,
      BGM_PATTERNS.fieldVillage,
      BGM_PATTERNS.fieldForest,
      BGM_PATTERNS.fieldDeepForest,
      BGM_PATTERNS.fieldTypeScript,
    ]
    for (const pattern of fieldTracks) expect(pattern.notes.length).toBeGreaterThanOrEqual(16)
    expect(BGM_PATTERNS.fieldVillage.notes).not.toEqual(BGM_PATTERNS.fieldForest.notes)
    expect(BGM_PATTERNS.fieldForest.notes).not.toEqual(BGM_PATTERNS.fieldDeepForest.notes)
    expect(BGM_PATTERNS.fieldDeepForest.notes).not.toEqual(BGM_PATTERNS.fieldTypeScript.notes)
  })

  it('Battleも短い8音loopに戻さずregion / Boss identityを維持する', () => {
    const battleTracks = BGM_TRACKS.filter((track) => track.startsWith('battle'))
    for (const track of battleTracks) {
      expect(BGM_PATTERNS[track].notes.length).toBeGreaterThanOrEqual(16)
    }
  })

  it('JS / TS Final Bossは同じBGM patternへfallbackしない', () => {
    expect(BGM_PATTERNS.battleJsBoss.notes).not.toEqual(BGM_PATTERNS.battleTsBoss.notes)
    expect(BGM_PATTERNS.battleJsBoss.type).not.toBe(BGM_PATTERNS.battleTsBoss.type)
  })

  it('現在request中のtrackだけがcleanupで停止できる', () => {
    expect(shouldReleaseBgm('battle', 'battle')).toBe(true)
    expect(shouldReleaseBgm('battleForest', 'battle')).toBe(false)
    expect(shouldReleaseBgm('fieldForest', 'field')).toBe(false)
    expect(shouldReleaseBgm('menu', 'field')).toBe(false)
    expect(shouldReleaseBgm(null, 'menu')).toBe(false)
  })

  it('default BGM volumeは実機で聞き取れる余裕を持たせる', () => {
    expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBeGreaterThanOrEqual(0.25)
    expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBeLessThan(DEFAULT_AUDIO_SETTINGS.seVolume)
  })
})
