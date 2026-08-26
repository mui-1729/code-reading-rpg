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

export type BgmTrack = 'battle'

export type AudioSettings = {
  muted: boolean
  seVolume: number
  bgmVolume: number
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  seVolume: 0.42,
  bgmVolume: 0.16,
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
    this.startDesiredBgm()
  }

  stopBgm(): void {
    this.desiredBgm = null
    this.activeBgm = null
    this.bgmStep = 0
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
      this.bgmTimer = window.setInterval(() => this.playBgmStep(), 180)
    }
  }

  private playBgmStep(): void {
    if (!this.bgmGain || this.activeBgm !== 'battle') return

    const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63]
    const frequency = notes[this.bgmStep % notes.length]
    this.bgmStep += 1
    this.tone(this.bgmGain, frequency, 135, { type: 'square', volume: 0.035 })

    if (this.bgmStep % 4 === 1) {
      this.tone(this.bgmGain, frequency / 2, 155, { type: 'triangle', volume: 0.028 })
    }
  }
}

export const gameAudio = new GameAudioEngine()
