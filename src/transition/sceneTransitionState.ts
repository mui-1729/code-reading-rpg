import { createContext } from 'react'

export type SceneTransitionKind = 'map' | 'encounter' | 'battle-start' | 'boss-start' | 'battle-return' | 'defeat-return' | 'connect' | 'return-real-world' | 'story-to-world'

export type SceneTransitionOptions = {
  label?: string
  fromMapId?: string
  toMapId?: string
  waitFor?: () => boolean
  /**
   * Replay gates can keep an existing domain handler as the SE authority while
   * still using the shared visual/input-lock timing. Direct scene transitions
   * leave this true (the default) so the semantic variant owns its sound.
   */
  playSound?: boolean
}

export type SceneTransitionContextValue = {
  isTransitioning: boolean
  runSceneTransition: (kind: SceneTransitionKind, swap: () => void | Promise<void>, options?: SceneTransitionOptions) => Promise<boolean>
}

export const SceneTransitionContext = createContext<SceneTransitionContextValue | null>(null)
