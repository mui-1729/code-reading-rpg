import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { EMPTY_EQUIPMENT, starterEquipmentIds, type EquipmentLoadout } from './equipment'

export type WorldPosition = { x: number; y: number }

export type RpgState = {
  equipment: EquipmentLoadout
  ownedEquipmentIds: string[]
  partyMemberIds: string[]
  partyEquipment: Record<string, EquipmentLoadout>
  worldPosition: WorldPosition
  stepsSinceEncounter: number
  encounterCount: number
}

export type StoredRpgState = {
  version: 1
  state: RpgState
}

type RpgContextValue = {
  rpgState: RpgState
  setRpgState: Dispatch<SetStateAction<RpgState>>
}

export const RPG_STORAGE_KEY = 'code-reading-rpg:rpg-state'
export const RPG_STATE_SCHEMA_VERSION = 1
const PROGRESS_RESET_EVENT = 'code-reading-rpg:progress-reset'

const RpgContext = createContext<RpgContextValue | null>(null)

export function createInitialRpgState(): RpgState {
  return {
    equipment: {
      weapon: 'training-blade',
      armor: 'traveler-coat',
      accessory: null,
    },
    ownedEquipmentIds: [...starterEquipmentIds],
    partyMemberIds: [],
    partyEquipment: {},
    worldPosition: { x: 20, y: 14 },
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

function isLoadout(value: unknown): value is EquipmentLoadout {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return ['weapon', 'armor', 'accessory'].every(
    (slot) => candidate[slot] === null || typeof candidate[slot] === 'string',
  )
}

export function serializeRpgState(state: RpgState): string {
  const stored: StoredRpgState = { version: RPG_STATE_SCHEMA_VERSION, state }
  return JSON.stringify(stored)
}

export function restoreRpgState(raw: string | null): RpgState {
  const initial = createInitialRpgState()
  if (!raw) return initial

  try {
    const parsed = JSON.parse(raw) as Partial<StoredRpgState>
    if (parsed.version !== RPG_STATE_SCHEMA_VERSION || !parsed.state) return initial
    const state = parsed.state as Partial<RpgState>
    const position = state.worldPosition
    return {
      equipment: isLoadout(state.equipment) ? state.equipment : initial.equipment,
      ownedEquipmentIds: Array.isArray(state.ownedEquipmentIds)
        ? state.ownedEquipmentIds.filter((id): id is string => typeof id === 'string')
        : initial.ownedEquipmentIds,
      partyMemberIds: Array.isArray(state.partyMemberIds)
        ? state.partyMemberIds.filter((id): id is string => typeof id === 'string')
        : initial.partyMemberIds,
      partyEquipment:
        state.partyEquipment && typeof state.partyEquipment === 'object'
          ? Object.fromEntries(
              Object.entries(state.partyEquipment).filter((entry): entry is [string, EquipmentLoadout] =>
                isLoadout(entry[1]),
              ),
            )
          : {},
      worldPosition:
        position && Number.isInteger(position.x) && Number.isInteger(position.y)
          ? { x: position.x, y: position.y }
          : initial.worldPosition,
      stepsSinceEncounter:
        typeof state.stepsSinceEncounter === 'number' && Number.isInteger(state.stepsSinceEncounter)
          ? Math.max(0, state.stepsSinceEncounter)
          : initial.stepsSinceEncounter,
      encounterCount:
        typeof state.encounterCount === 'number' && Number.isInteger(state.encounterCount)
          ? Math.max(0, state.encounterCount)
          : initial.encounterCount,
    }
  } catch {
    return initial
  }
}

function loadInitialRpgState() {
  if (typeof window === 'undefined') return createInitialRpgState()
  try {
    return restoreRpgState(window.localStorage.getItem(RPG_STORAGE_KEY))
  } catch {
    return createInitialRpgState()
  }
}

export function RpgProvider({ children }: { children: ReactNode }) {
  const [rpgState, setRpgState] = useState(loadInitialRpgState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(RPG_STORAGE_KEY, serializeRpgState(rpgState))
    } catch {
      // Keep the in-memory RPG state usable when storage is unavailable.
    }
  }, [rpgState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reset = () => setRpgState(createInitialRpgState())
    window.addEventListener(PROGRESS_RESET_EVENT, reset)
    return () => window.removeEventListener(PROGRESS_RESET_EVENT, reset)
  }, [])

  const value = useMemo(() => ({ rpgState, setRpgState }), [rpgState])
  return <RpgContext.Provider value={value}>{children}</RpgContext.Provider>
}

export function useRpg() {
  const value = useContext(RpgContext)
  if (!value) throw new Error('useRpg must be used within RpgProvider')
  return value
}

export function emptyPartyEquipment(): EquipmentLoadout {
  return { ...EMPTY_EQUIPMENT }
}
