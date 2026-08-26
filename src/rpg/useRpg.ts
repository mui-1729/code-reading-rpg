import { useContext } from 'react'
import { RpgContext } from './RpgContext'

export function useRpg() {
  const value = useContext(RpgContext)
  if (!value) throw new Error('useRpg must be used within RpgProvider')
  return value
}
