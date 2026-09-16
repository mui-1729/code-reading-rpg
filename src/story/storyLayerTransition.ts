import type { SceneTransitionKind } from '../transition/sceneTransitionState'
import type { StoryWorldLayer } from './types'

export type StoryLayerTransitionKind = Extract<
  SceneTransitionKind,
  'connect' | 'return-real-world'
>

export function getStoryLayerTransitionKind(
  from: StoryWorldLayer,
  to: StoryWorldLayer,
): StoryLayerTransitionKind | null {
  if (to === 'connect' && from !== 'connect') return 'connect'
  if (to === 'code-world' && (from === 'real-world' || from === 'remote')) return 'connect'

  if (to === 'return' && from !== 'return' && from !== 'real-world') return 'return-real-world'
  if (
    to === 'real-world' &&
    (from === 'code-world' || from === 'remote' || from === 'connect')
  ) return 'return-real-world'

  return null
}
