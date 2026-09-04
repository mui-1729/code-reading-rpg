import { BASE_PLAYER_HP } from '../progression/constants'
import {
  getWorldMapDimensions,
  isWorldMapId,
  isWorldPositionInBounds,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_MAP_STARTS,
  WORLD_TREASURES,
  type WorldMapId,
  type WorldTreasureId,
} from '../world/worldMap'
import {
  getInitialWorldCheckpoint,
  restoreWorldCheckpoint,
  type WorldCheckpoint,
} from '../world/checkpoints'
import {
  equipmentById,
  getEquipmentBonuses,
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
  worldMapId: WorldMapId
  worldPosition: WorldPosition
  worldCheckpoint: WorldCheckpoint
  stepsSinceEncounter: number
  encounterCount: number
  currentHp: number
  openedTreasureIds: WorldTreasureId[]
}

export type StoredRpgState = {
  version: 6
  state: RpgState
}

type LegacyRpgStateWithoutCheckpoint = Omit<RpgState, 'worldCheckpoint'>

type LegacyStoredRpgStateV5 = {
  version: 5
  state: LegacyRpgStateWithoutCheckpoint
}

type LegacyStoredRpgStateV4 = {
  version: 4
  state: LegacyRpgStateWithoutCheckpoint & { partyEquipment?: Record<string, EquipmentLoadout> }
}

type LegacyStoredRpgStateV3 = {
  version: 3
  state: Omit<LegacyRpgStateWithoutCheckpoint, 'worldMapId'>
}

type LegacyStoredRpgStateV2 = {
  version: 2
  state: Omit<LegacyRpgStateWithoutCheckpoint, 'worldMapId' | 'openedTreasureIds'>
}

type LegacyStoredRpgStateV1 = {
  version: 1
  state: Omit<LegacyRpgStateWithoutCheckpoint, 'worldMapId' | 'currentHp' | 'openedTreasureIds'>
}

export const RPG_STORAGE_KEY = 'code-reading-rpg:rpg-state'
export const RPG_STATE_SCHEMA_VERSION = 6

const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'accessory']

const initialEquipment = (): EquipmentLoadout => ({
  weapon: 'training-blade',
  armor: 'traveler-coat',
  accessory: null,
})

export function getMaxHpForRpgState(baseMaxHp: number, state: Pick<RpgState, 'equipment'>): number {
  return Math.max(1, Math.floor(baseMaxHp) + getEquipmentBonuses(state.equipment).maxHp)
}

export function createInitialRpgState(baseMaxHp = BASE_PLAYER_HP): RpgState {
  const equipment = initialEquipment()
  const currentHp = getMaxHpForRpgState(baseMaxHp, { equipment })

  return {
    equipment,
    ownedEquipmentIds: [...starterEquipmentIds],
    partyMemberIds: [],
    worldMapId: OVERWORLD_MAP_ID,
    worldPosition: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    worldCheckpoint: getInitialWorldCheckpoint(),
    stepsSinceEncounter: 8,
    encounterCount: 0,
    currentHp,
    openedTreasureIds: [],
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

function uniqueKnownTreasureIds(value: unknown): WorldTreasureId[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value.filter(
        (id): id is WorldTreasureId =>
          typeof id === 'string' && WORLD_TREASURES.some((treasure) => treasure.id === id),
      ),
    ),
  )
}

function emptyLoadout(): EquipmentLoadout {
  return { weapon: null, armor: null, accessory: null }
}

function normalizeLoadout(
  value: unknown,
  ownedEquipmentIds: readonly string[],
): EquipmentLoadout {
  if (!isLoadout(value)) return emptyLoadout()
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

function migrateLegacyTypeScriptPosition(position: WorldPosition): WorldPosition {
  if (position.x === 30 && position.y === 18) {
    return { x: 19, y: 15 }
  }

  const { width, height } = getWorldMapDimensions(TS_FRONTIER_MAP_ID)
  return {
    x: Math.max(1, Math.min(width - 2, position.x - 21)),
    y: Math.max(1, Math.min(height - 2, position.y)),
  }
}

function normalizeWorldLocation(
  mapIdValue: unknown,
  positionValue: unknown,
  legacyOverworldLayout: boolean,
): { mapId: WorldMapId; position: WorldPosition } {
  if (!isWorldMapId(mapIdValue)) {
    return {
      mapId: OVERWORLD_MAP_ID,
      position: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    }
  }
  const mapId = mapIdValue

  if (!positionValue || typeof positionValue !== 'object') {
    return {
      mapId: OVERWORLD_MAP_ID,
      position: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    }
  }

  const position = positionValue as Partial<WorldPosition>
  if (!Number.isInteger(position.x) || !Number.isInteger(position.y)) {
    return {
      mapId: OVERWORLD_MAP_ID,
      position: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    }
  }

  const normalized = { x: position.x as number, y: position.y as number }
  if (!isWorldPositionInBounds(mapId, normalized)) {
    return {
      mapId: OVERWORLD_MAP_ID,
      position: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
    }
  }

  if (legacyOverworldLayout && mapId === OVERWORLD_MAP_ID) {
    const wasPlayableTypeScriptSide =
      normalized.x >= 23 &&
      normalized.x < 39 &&
      normalized.y > 0 &&
      normalized.y < 27
    if (wasPlayableTypeScriptSide) {
      return {
        mapId: TS_FRONTIER_MAP_ID,
        position: migrateLegacyTypeScriptPosition(normalized),
      }
    }
  }

  return { mapId, position: normalized }
}

function normalizeCurrentHp(value: unknown, maxHp: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return maxHp
  return Math.max(0, Math.min(maxHp, Math.floor(value)))
}

export function serializeRpgState(state: RpgState): string {
  const stored: StoredRpgState = { version: RPG_STATE_SCHEMA_VERSION, state }
  return JSON.stringify(stored)
}

export function restoreRpgState(raw: string | null, baseMaxHp = BASE_PLAYER_HP): RpgState {
  const initial = createInitialRpgState(baseMaxHp)
  if (!raw) return initial

  try {
    const parsed = JSON.parse(raw) as Partial<
      | StoredRpgState
      | LegacyStoredRpgStateV5
      | LegacyStoredRpgStateV4
      | LegacyStoredRpgStateV3
      | LegacyStoredRpgStateV2
      | LegacyStoredRpgStateV1
    >
    if (
      (parsed.version !== 1 &&
        parsed.version !== 2 &&
        parsed.version !== 3 &&
        parsed.version !== 4 &&
        parsed.version !== 5 &&
        parsed.version !== RPG_STATE_SCHEMA_VERSION) ||
      !parsed.state
    ) {
      return initial
    }

    const state = parsed.state as Partial<RpgState>
    const ownedEquipmentIds = uniqueKnownEquipmentIds(state.ownedEquipmentIds)
    const partyMemberIds = uniqueKnownPartyIds(state.partyMemberIds)
    const equipment = normalizeLoadout(state.equipment, ownedEquipmentIds)
    const maxHp = getMaxHpForRpgState(baseMaxHp, { equipment })
    const hasStableMapId = parsed.version === 4 || parsed.version === 5 || parsed.version === 6
    const worldLocation = normalizeWorldLocation(
      hasStableMapId ? state.worldMapId : OVERWORLD_MAP_ID,
      state.worldPosition,
      parsed.version !== 6,
    )

    return {
      equipment,
      ownedEquipmentIds,
      partyMemberIds,
      worldMapId: worldLocation.mapId,
      worldPosition: worldLocation.position,
      worldCheckpoint:
        parsed.version === 6
          ? restoreWorldCheckpoint(state.worldCheckpoint)
          : getInitialWorldCheckpoint(),
      stepsSinceEncounter:
        typeof state.stepsSinceEncounter === 'number' && Number.isInteger(state.stepsSinceEncounter)
          ? Math.max(0, state.stepsSinceEncounter)
          : initial.stepsSinceEncounter,
      encounterCount:
        typeof state.encounterCount === 'number' && Number.isInteger(state.encounterCount)
          ? Math.max(0, state.encounterCount)
          : initial.encounterCount,
      currentHp:
        parsed.version === 1 ? maxHp : normalizeCurrentHp(state.currentHp, maxHp),
      openedTreasureIds:
        parsed.version === 3 || parsed.version === 4 || parsed.version === 5 || parsed.version === 6
          ? uniqueKnownTreasureIds(state.openedTreasureIds)
          : [],
    }
  } catch {
    return initial
  }
}
