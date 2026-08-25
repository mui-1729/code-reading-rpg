import { useMemo, useState, type ReactNode } from 'react'
import { ProgressContext } from './ProgressContext'
import { createInitialPlayerProgress, getPlayerStats } from './progression'

type ProgressProviderProps = {
  children: ReactNode
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useState(createInitialPlayerProgress)
  const stats = useMemo(() => getPlayerStats(progress.exp), [progress.exp])
  const value = useMemo(() => ({ progress, stats, setProgress }), [progress, stats])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
