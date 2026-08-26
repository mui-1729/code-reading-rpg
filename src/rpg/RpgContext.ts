import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { RpgState } from './state'

export type RpgContextValue = {
  rpgState: RpgState
  setRpgState: Dispatch<SetStateAction<RpgState>>
}

export const RpgContext = createContext<RpgContextValue | null>(null)
