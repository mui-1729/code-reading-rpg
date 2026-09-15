import { createContext } from 'react'

export type SceneTransitionKind = 'map' | 'encounter' | 'battle-start' | 'boss-start' | 'battle-return' | 'defeat-return' | 'connect' | 'return-real-world' | 'story-to-world'

export type SceneTransitionOptions = {
  label?: string
  fromMapId?: string
  toMapId?: string
  waitFor?: () => boolean
}

export type SceneTransitionContextValue = {
  isTransitioning: boolean
  runSceneTransition: (kind: SceneTransitionKind, swap: () => void | Promise<void>, options?: SceneTransitionOptions) => Promise<boolean>
}

export const SceneTransitionContext = createContext<SceneTransitionContextValue | null>(null)
