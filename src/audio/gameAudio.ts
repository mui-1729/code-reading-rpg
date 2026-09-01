export type SoundEffect =
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'execute'
  | 'enemyHit'
  | 'enemyDefeat'
  | 'enemyAttack'
  | 'playerHit'
  | 'victory'
  | 'defeat'
  | 'levelUp'
  | 'skillUnlock'
  | 'stageClear'

export type BgmTrack =
  | 'menu'
  | 'field'
  | 'fieldVillage'
  | 'fieldForest'
  | 'fieldDeepForest'
  | 'fieldTypeScript'
  | 'battle'
  | 'battleForest'
  | 'battleDeepForest'
  | 'battleTypeScript'
  | 'battleBoss'
  | 'battleJsBoss'
  | 'battleTsBoss'

export type AudioSettings = {
  muted: boolean
  seVolume: number
  bgmVolume: number
}

type BgmPattern = {
  notes: readonly number[]
  stepMs: number
  noteMs: number
  type: OscillatorType
  volume: number
  bassEvery: number
  bassVolume: number
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  seVolume: 0.42,
  bgmVolume: 0.28,
}

export const BGM_TRACKS: readonly BgmTrack[] = [
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
]

export const BGM_PATTERNS: Readonly<Record<BgmTrack, BgmPattern>> = {
  menu: {
    notes: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 261.63, 329.63, 392, 493.88, 440, 392, 349.23, 293.66],
    stepMs: 260,
    noteMs: 205,
    type: 'triangle',
    volume: 0.075,
    bassEvery: 4,
    bassVolume: 0.05,
  },
  field: {
    notes: [220, 261.63, 329.63, 261.63, 246.94, 293.66, 369.99, 293.66, 220, 277.18, 329.63, 392, 329.63, 293.66, 261.63, 246.94],
    stepMs: 220,
    noteMs: 170,
    type: 'square',
    volume: 0.08,
    bassEvery: 4,
    bassVolume: 0.052,
  },
  fieldVillage: {
    notes: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 349.23, 261.63, 293.66, 329.63, 392, 440, 392, 349.23, 293.66],
    stepMs: 255,
    noteMs: 205,
    type: 'triangle',
    volume: 0.068,
    bassEvery: 4,
    bassVolume: 0.042,
  },
  fieldForest: {
    notes: [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63, 196, 233.08, 293.66, 349.23, 293.66, 261.63, 233.08, 220],
    stepMs: 235,
    noteMs: 185,
    type: 'triangle',
    volume: 0.072,
    bassEvery: 4,
    bassVolume: 0.047,
  },
  fieldDeepForest: {
    notes: [146.83, 174.61, 220, 196, 164.81, 196, 233.08, 174.61, 146.83, 164.81, 196, 220, 196, 174.61, 164.81, 130.81],
    stepMs: 265,
    noteMs: 215,
    type: 'sawtooth',
    volume: 0.058,
    bassEvery: 4,
    bassVolume: 0.044,
  },
  fieldTypeScript: {
    notes: [293.66, 369.99, 440, 369.99, 329.63, 415.3, 493.88, 415.3, 277.18, 349.23, 440, 523.25, 440, 392, 329.63, 293.66],
    stepMs: 210,
    noteMs: 158,
    type: 'triangle',
    volume: 0.07,
    bassEvery: 4,
    bassVolume: 0.04,
  },
  battle: {
    notes: [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63, 196, 233.08, 293.66, 349.23, 329.63, 293.66, 261.63, 220],
    stepMs: 180,
    noteMs: 140,
    type: 'square',
    volume: 0.1,
    bassEvery: 4,
    bassVolume: 0.06,
  },
  battleForest: {
    notes: [174.61, 220, 261.63, 220, 196, 246.94, 293.66, 246.94, 174.61, 207.65, 261.63, 311.13, 293.66, 261.63, 220, 196],
    stepMs: 205,
    noteMs: 158,
    type: 'triangle',
    volume: 0.09,
    bassEvery: 4,
    bassVolume: 0.058,
  },
  battleDeepForest: {
    notes: [146.83, 174.61, 220, 196, 164.81, 196, 233.08, 174.61, 130.81, 164.81, 207.65, 246.94, 220, 196, 174.61, 146.83],
    stepMs: 225,
    noteMs: 180,
    type: 'sawtooth',
    volume: 0.075,
    bassEvery: 2,
    bassVolume: 0.052,
  },
  battleTypeScript: {
    notes: [293.66, 369.99, 440, 369.99, 329.63, 415.3, 493.88, 415.3, 277.18, 349.23, 440, 523.25, 493.88, 440, 392, 329.63],
    stepMs: 170,
    noteMs: 122,
    type: 'triangle',
    volume: 0.085,
    bassEvery: 4,
    bassVolume: 0.048,
  },
  battleBoss: {
    notes: [130.81, 164.81, 196, 130.81, 146.83, 174.61, 207.65, 146.83, 123.47, 155.56, 196, 233.08, 207.65, 174.61, 146.83, 130.81],
    stepMs: 165,
    noteMs: 138,
    type: 'square',
    volume: 0.105,
    bassEvery: 2,
    bassVolume: 0.07,
  },
  battleJsBoss: {
    notes: [110, 130.81, 164.81, 123.47, 98, 146.83, 174.61, 116.54, 103.83, 138.59, 164.81, 196, 174.61, 146.83, 123.47, 98],
    stepMs: 190,
    noteMs: 165,
    type: 'sawtooth',
    volume: 0.095,
    bassEvery: 2,
    bassVolume: 0.075,
  },
  battleTsBoss: {
    notes: [246.94, 369.99, 277.18, 415.3, 220, 329.63, 261.63, 392, 233.08, 349.23, 293.66, 440, 261.63, 392, 329.63, 493.88],
    stepMs: 155,
    noteMs: 118,
    type: 'square',
    volume: 0.09,
    bassEvery: 3,
    bassVolume: 0.06,
  },
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function normalizeAudioSettings(settings: AudioSettings): AudioSettings {
  return {
    muted: Boolean(settings.muted),
    seVolume: clamp01(settings.seVolume),
    bgmVolume: clamp01(settings.bgmVolume),
  }
}

export function getChannelVolume(
  settings: AudioSettings,
  channel: 'se' | 'bgm',
): number {
  if (settings.muted) return 0
  return channel === 'se' ? settings.seVolume : settings.bgmVolume
}

export function shouldReleaseBgm(current: BgmTrack | null, released: BgmTrack): boolean {
  return current === released
}

class GameAudioEngine {
  private settings = DEFAULT_AUDIO_SETTINGS
  private context: AudioContext | null = null
  private seGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private desiredBgm: BgmTrack | null = null
  private activeBgm: BgmTrack | null = null
  private bgmTimer: number | null = null
  private bgmStep = 0

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  setSettings(next: AudioSettings): AudioSettings {
    this.settings = normalizeAudioSettings(next)
    this.applyChannelVolumes()
    return this.getSettings()
  }

  async unlock(): Promise<void> {
    if (typeof window === 'undefined') return

    if (!this.context) {
      this.context = new AudioContext()
      this.seGain = this.context.createGain()
      this.bgmGain = this.context.createGain()
      this.seGain.connect(this.context.destination)
      this.bgmGain.connect(this.context.destination)
      this.applyChannelVolumes()
    }

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    this.startDesiredBgm()
  }

  playSe(effect: SoundEffect): void {
    void this.unlock()
      .then(() => this.playEffect(effect))
      .catch(() => undefined)
  }

  requestBgm(track: BgmTrack): void {
    this.desiredBgm = track
    if (typeof document !== 'undefined') document.body.dataset.bgmTrack = track
    this.startDesiredBgm()
  }

  releaseBgm(track: BgmTrack): void {
    if (!shouldReleaseBgm(this.desiredBgm, track)) return
    this.stopBgm()
  }

  stopBgm(): void {
    this.desiredBgm = null
    this.activeBgm = null
    this.bgmStep = 0
    if (typeof document !== 'undefined') delete document.body.dataset.bgmTrack
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer)
    }
    this.bgmTimer = null
  }

  private applyChannelVolumes(): void {
    if (!this.context) return
    const now = this.context.currentTime
    this.seGain?.gain.setTargetAtTime(getChannelVolume(this.settings, 'se'), now, 0.01)
    this.bgmGain?.gain.setTargetAtTime(getChannelVolume(this.settings, 'bgm'), now, 0.01)
  }

  private tone(
    destination: GainNode,
    frequency: number,
    durationMs: number,
    options: {
      delayMs?: number
      type?: OscillatorType
      volume?: number
      endFrequency?: number
    } = {},
  ): void {
    if (!this.context) return

    const start = this.context.currentTime + (options.delayMs ?? 0) / 1000
    const end = start + durationMs / 1000
    const oscillator = this.context.createOscillator()
    const envelope = this.context.createGain()

    oscillator.type = options.type ?? 'square'
    oscillator.frequency.setValueAtTime(frequency, start)
    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end)
    }

    const peak = options.volume ?? 0.09
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(peak, start + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(envelope)
    envelope.connect(destination)
    oscillator.start(start)
    oscillator.stop(end + 0.015)
  }

  private playEffect(effect: SoundEffect): void {
    if (!this.seGain) return

    switch (effect) {
      case 'select':
        this.tone(this.seGain, 720, 55, { volume: 0.055 })
        break
      case 'confirm':
        this.tone(this.seGain, 520, 70, { volume: 0.06 })
        this.tone(this.seGain, 780, 85, { delayMs: 55, volume: 0.055 })
        break
      case 'cancel':
        this.tone(this.seGain, 360, 80, { endFrequency: 220, type: 'triangle', volume: 0.07 })
        break
      case 'execute':
        this.tone(this.seGain, 190, 140, { endFrequency: 520, type: 'sawtooth', volume: 0.08 })
        this.tone(this.seGain, 760, 65, { delayMs: 95, volume: 0.05 })
        break
      case 'enemyHit':
        this.tone(this.seGain, 130, 90, { endFrequency: 75, type: 'sawtooth', volume: 0.11 })
        this.tone(this.seGain, 95, 75, { delayMs: 35, volume: 0.08 })
        break
      case 'enemyDefeat':
        this.tone(this.seGain, 300, 110, { endFrequency: 170, type: 'square', volume: 0.08 })
        this.tone(this.seGain, 190, 140, { delayMs: 85, endFrequency: 95, type: 'square', volume: 0.07 })
        break
      case 'enemyAttack':
        this.tone(this.seGain, 170, 120, { endFrequency: 280, type: 'sawtooth', volume: 0.065 })
        break
      case 'playerHit':
        this.tone(this.seGain, 105, 150, { endFrequency: 58, type: 'sawtooth', volume: 0.115 })
        break
      case 'victory':
        this.tone(this.seGain, 523.25, 120, { volume: 0.065 })
        this.tone(this.seGain, 659.25, 120, { delayMs: 105, volume: 0.065 })
        this.tone(this.seGain, 783.99, 230, { delayMs: 210, volume: 0.075 })
        break
      case 'defeat':
        this.tone(this.seGain, 246.94, 160, { endFrequency: 220, type: 'triangle', volume: 0.075 })
        this.tone(this.seGain, 196, 190, { delayMs: 130, endFrequency: 164.81, type: 'triangle', volume: 0.075 })
        this.tone(this.seGain, 130.81, 260, { delayMs: 280, type: 'triangle', volume: 0.08 })
        break
      case 'levelUp':
        ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
          this.tone(this.seGain!, frequency, 105, { delayMs: index * 75, volume: 0.05 }),
        )
        break
      case 'skillUnlock':
        this.tone(this.seGain, 392, 95, { volume: 0.05 })
        this.tone(this.seGain, 587.33, 95, { delayMs: 80, volume: 0.055 })
        this.tone(this.seGain, 783.99, 160, { delayMs: 160, volume: 0.06 })
        break
      case 'stageClear':
        ;[392, 523.25, 659.25, 783.99].forEach((frequency, index) =>
          this.tone(this.seGain!, frequency, 105, { delayMs: index * 90, volume: 0.045 }),
        )
        break
    }
  }

  private startDesiredBgm(): void {
    if (!this.context || this.context.state !== 'running' || !this.bgmGain || !this.desiredBgm) return
    if (this.activeBgm === this.desiredBgm && this.bgmTimer !== null) return

    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer)
    }

    this.activeBgm = this.desiredBgm
    this.bgmStep = 0
    this.playBgmStep()

    if (typeof window !== 'undefined') {
      const pattern = BGM_PATTERNS[this.activeBgm]
      this.bgmTimer = window.setInterval(() => this.playBgmStep(), pattern.stepMs)
    }
  }

  private playBgmStep(): void {
    if (!this.bgmGain || !this.activeBgm) return

    const pattern = BGM_PATTERNS[this.activeBgm]
    const frequency = pattern.notes[this.bgmStep % pattern.notes.length]
    this.bgmStep += 1
    this.tone(this.bgmGain, frequency, pattern.noteMs, {
      type: pattern.type,
      volume: pattern.volume,
    })

    if (this.bgmStep % pattern.bassEvery === 1) {
      this.tone(this.bgmGain, frequency / 2, pattern.noteMs + 30, {
        type: 'triangle',
        volume: pattern.bassVolume,
      })
    }
  }
}

export const gameAudio = new GameAudioEngine()
