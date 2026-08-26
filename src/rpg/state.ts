import { WORLD_HEIGHT, WORLD_START, WORLD_WIDTH } from '../world/worldMap'
import {
  equipmentById,
  starterEquipmentIds,
  type EquipmentLoadout,
  type EquipmentSlot,
} from './equipment'
import { partyMemberById } from './party'

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

export const RPG_STORAGE_KEY = 'code-reading-rpg:rpg-state'
export const RPG_STATE_SCHEMA_VERSION = 1

const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'accessory']

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
    worldPosition: { ...WORLD_START },
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

function isLoadout(value: unknown): value is EquipmentLoadout {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return equipmentSlots.every(
    (slot) => candidate[slot] === null || typeof candidate[slot] === 'string',
  )
}

function uniqueKnownEquipmentIds(value: unknown): string[] {
  const storedIds = Array.isArray(value)
    ? value.filter(
        (id): id is string => typeof id === 'string' && equipmentById[id] !== undefined,
      )
    : []

  return Array.from(new Set([...starterEquipmentIds, ...storedIds]))
}

function uniqueKnownPartyIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && partyMemberById[id] !== undefined,
      ),
    ),
  )
}

function normalizeLoadout(
  value: unknown,
  ownedEquipmentIds: readonly string[],
): EquipmentLoadout {
  if (!isLoadout(value)) return emptyPartyEquipment()
  const owned = new Set(ownedEquipmentIds)

  return Object.fromEntries(
    equipmentSlots.map((slot) => {
      const equipmentId = value[slot]
      if (equipmentId === null) return [slot, null]

      const item = equipmentById[equipmentId]
      if (!item || item.slot !== slot || !owned.has(equipmentId)) return [slot, null]
      return [slot, equipmentId]
    }),
  ) as EquipmentLoadout
}

function normalizeWorldPosition(value: unknown): WorldPosition {
  if (!value || typeof value !== 'object') return { ...WORLD_START }
  const position = value as Partial<WorldPosition>
  if (!Number.isInteger(position.x) || !Number.isInteger(position.y)) return { ...WORLD_START }

  const x = position.x as number
  const y = position.y as number
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return { ...WORLD_START }
  return { x, y }
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
    const ownedEquipmentIds = uniqueKnownEquipmentIds(state.ownedEquipmentIds)
    const partyMemberIds = uniqueKnownPartyIds(state.partyMemberIds)
    const joinedPartyMembers = new Set(partyMemberIds)
    const partyEquipment =
      state.partyEquipment && typeof state.partyEquipment === 'object'
        ? Object.fromEntries(
            Object.entries(state.partyEquipment)
              .filter(([memberId]) => joinedPartyMembers.has(memberId))
              .map(([memberId, loadout]) => [
                memberId,
                normalizeLoadout(loadout, ownedEquipmentIds),
              ]),
          ) as Record<string, EquipmentLoadout>
        : {}

    return {
      equipment: normalizeLoadout(state.equipment, ownedEquipmentIds),
      ownedEquipmentIds,
      partyMemberIds,
      partyEquipment,
      worldPosition: normalizeWorldPosition(state.worldPosition),
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

export function emptyPartyEquipment(): EquipmentLoadout {
  return { weapon: null, armor: null, accessory: null }
}
