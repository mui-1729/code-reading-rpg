import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  WORLD_MAP_STARTS,
  type WorldMapId,
} from './worldMap'

export type WorldCheckpointId = 'central-hub' | 'greenfield-village'

export type WorldCheckpoint = {
  id: WorldCheckpointId
  mapId: WorldMapId
  position: { x: number; y: number }
}

type WorldCheckpointDefinition = WorldCheckpoint & {
  label: string
}

const WORLD_CHECKPOINTS: Record<WorldCheckpointId, WorldCheckpointDefinition> = {
  'central-hub': {
    id: 'central-hub',
    label: '中央Hub',
    mapId: OVERWORLD_MAP_ID,
    position: { ...WORLD_MAP_STARTS[OVERWORLD_MAP_ID] },
  },
  'greenfield-village': {
    id: 'greenfield-village',
    label: 'グリーンフィールド村',
    mapId: JS_VILLAGE_MAP_ID,
    position: { ...WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID] },
  },
}

export const DEFAULT_WORLD_CHECKPOINT_ID: WorldCheckpointId = 'central-hub'

export function getWorldCheckpointDefinition(id: WorldCheckpointId): WorldCheckpointDefinition {
  return WORLD_CHECKPOINTS[id]
}

export function createWorldCheckpoint(id: WorldCheckpointId): WorldCheckpoint {
  const definition = getWorldCheckpointDefinition(id)
  return {
    id: definition.id,
    mapId: definition.mapId,
    position: { ...definition.position },
  }
}

export function isWorldCheckpointId(value: unknown): value is WorldCheckpointId {
  return value === 'central-hub' || value === 'greenfield-village'
}

export function normalizeWorldCheckpoint(value: unknown): WorldCheckpoint {
  if (!value || typeof value !== 'object') return createWorldCheckpoint(DEFAULT_WORLD_CHECKPOINT_ID)
  const candidate = value as Partial<WorldCheckpoint>
  if (!isWorldCheckpointId(candidate.id)) return createWorldCheckpoint(DEFAULT_WORLD_CHECKPOINT_ID)

  // The id is the semantic authority. Rebuild map/position from the registry so
  // future map-layout changes do not preserve stale checkpoint coordinates.
  return createWorldCheckpoint(candidate.id)
}

export function inferLegacyWorldCheckpoint(mapId: WorldMapId): WorldCheckpoint {
  if (
    mapId === JS_VILLAGE_MAP_ID ||
    mapId === JS_FOREST_MAP_ID ||
    mapId === JS_DEEP_FOREST_MAP_ID
  ) {
    return createWorldCheckpoint('greenfield-village')
  }
  return createWorldCheckpoint(DEFAULT_WORLD_CHECKPOINT_ID)
}

export function getCheckpointIdForMapEntry(mapId: WorldMapId): WorldCheckpointId | null {
  return mapId === JS_VILLAGE_MAP_ID ? 'greenfield-village' : null
}

export function registerWorldCheckpoint<
  T extends { safeCheckpoint: WorldCheckpoint },
>(state: T, id: WorldCheckpointId): T {
  const safeCheckpoint = createWorldCheckpoint(id)
  if (
    state.safeCheckpoint.id === safeCheckpoint.id &&
    state.safeCheckpoint.mapId === safeCheckpoint.mapId &&
    state.safeCheckpoint.position.x === safeCheckpoint.position.x &&
    state.safeCheckpoint.position.y === safeCheckpoint.position.y
  ) {
    return state
  }
  return { ...state, safeCheckpoint }
}

export function registerCheckpointForMapEntry<
  T extends { worldMapId: WorldMapId; safeCheckpoint: WorldCheckpoint },
>(state: T): T {
  const checkpointId = getCheckpointIdForMapEntry(state.worldMapId)
  return checkpointId ? registerWorldCheckpoint(state, checkpointId) : state
}
