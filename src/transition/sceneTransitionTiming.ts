import type { SoundEffect } from '../audio/gameAudio'
import type { SceneTransitionKind } from './sceneTransitionState'

type SceneTransitionTiming = { coverMs: number; revealMs: number; alertMs: number; se: SoundEffect }

const timings: Record<SceneTransitionKind, SceneTransitionTiming> = {
  map: { coverMs: 180, revealMs: 220, alertMs: 0, se: 'confirm' },
  encounter: { coverMs: 180, revealMs: 190, alertMs: 260, se: 'encounter' },
  'battle-start': { coverMs: 180, revealMs: 220, alertMs: 0, se: 'execute' },
  'boss-start': { coverMs: 250, revealMs: 260, alertMs: 0, se: 'execute' },
  'battle-return': { coverMs: 150, revealMs: 220, alertMs: 0, se: 'cancel' },
  'defeat-return': { coverMs: 220, revealMs: 260, alertMs: 0, se: 'cancel' },
  connect: { coverMs: 260, revealMs: 300, alertMs: 0, se: 'skillUnlock' },
  'return-real-world': { coverMs: 240, revealMs: 280, alertMs: 0, se: 'stageClear' },
  'story-to-world': { coverMs: 170, revealMs: 220, alertMs: 0, se: 'confirm' },
}

export function getSceneTransitionTiming(kind: SceneTransitionKind, reducedMotion: boolean): SceneTransitionTiming {
  const timing = timings[kind]
  return reducedMotion ? { ...timing, coverMs: 80, revealMs: 90 } : timing
}
