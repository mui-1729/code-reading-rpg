import { useContext } from 'react'
import { TutorialContext } from './TutorialContext'

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) throw new Error('useTutorial must be used inside TutorialProvider')
  return context
}
