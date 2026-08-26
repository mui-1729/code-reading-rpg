import { useContext } from 'react'
import { ProgressContext } from './ProgressContext'

export function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress must be used within ProgressProvider')
  return value
}
