import {
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  WORLD_MAP_STARTS,
  type WorldMapId,
} from './worldMap'

export type WorldCheckpoint = {
  id: string
  label: string
  mapId: WorldMapId
  position: { x: number; y: number }
}

const checkpoint = (
  id: string,
  label: string,
  mapId: WorldMapId,
  position: { x: number; y: number },
): WorldCheckpoint => ({ id, label, mapId, position: { ...position } })

export const WORLD_CHECKPOINTS = {
  arrival: checkpoint(
    'arrival-hub',
    '到着地点',
    OVERWORLD_MAP_ID,
    WORLD_MAP_STARTS[OVERWORLD_MAP_ID],
  ),
  greenfield: checkpoint(
    'greenfield-village',
    'グリーンフィールド村',
    JS_VILLAGE_MAP_ID,
    WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID],
  ),
} as const

export function getInitialWorldCheckpoint(): WorldCheckpoint {
  return {
    ...WORLD_CHECKPOINTS.arrival,
    position: { ...WORLD_CHECKPOINTS.arrival.position },
  }
}

export function getWorldCheckpointForMapEntry(mapId: WorldMapId): WorldCheckpoint | null {
  if (mapId === JS_VILLAGE_MAP_ID) {
    return {
      ...WORLD_CHECKPOINTS.greenfield,
      position: { ...WORLD_CHECKPOINTS.greenfield.position },
    }
  }
  return null
}

export function restoreWorldCheckpoint(value: unknown): WorldCheckpoint {
  if (!value || typeof value !== 'object') return getInitialWorldCheckpoint()
  const candidate = value as Partial<WorldCheckpoint>
  const known = Object.values(WORLD_CHECKPOINTS).find((entry) => entry.id === candidate.id)
  if (!known) return getInitialWorldCheckpoint()
  return {
    ...known,
    position: { ...known.position },
  }
}
