import { useContext } from 'react'
import { SceneTransitionContext } from './sceneTransitionState'

export function useSceneTransition() {
  const value = useContext(SceneTransitionContext)
  if (!value) throw new Error('useSceneTransition must be used within SceneTransitionProvider')
  return value
}
