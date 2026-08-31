import { useMemo, useState, type ReactNode } from 'react'
import { BattleRuntimeContext, type BattleRuntimeSnapshot } from './BattleRuntimeContext'

export function BattleRuntimeProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<BattleRuntimeSnapshot | null>(null)
  const value = useMemo(() => ({ snapshot, setSnapshot }), [snapshot])
  return <BattleRuntimeContext.Provider value={value}>{children}</BattleRuntimeContext.Provider>
}
