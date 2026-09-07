import type { WorldCheckpointId } from './worldCheckpoints'
import {
  JS_FOREST_SETTLEMENT_MAP_ID,
  JS_VILLAGE_MAP_ID,
  type WorldMapId,
} from './worldMap'

export type VillageFacilityKind = 'inn' | 'item-shop' | 'equipment-shop'

export type VillageFacility = {
  kind: VillageFacilityKind
  mapId: WorldMapId
  label: string
  actionLabel: string
  locationLabel: string
  checkpointId?: WorldCheckpointId
  position: { x: number; y: number }
}

export const VILLAGE_FACILITIES: readonly VillageFacility[] = [
  {
    kind: 'inn',
    mapId: JS_VILLAGE_MAP_ID,
    label: '宿',
    actionLabel: '宿で休む',
    locationLabel: 'グリーンフィールド村',
    checkpointId: 'greenfield-village',
    position: { x: 5, y: 11 },
  },
  {
    kind: 'item-shop',
    mapId: JS_VILLAGE_MAP_ID,
    label: '道具屋',
    actionLabel: '道具屋を見る',
    locationLabel: 'グリーンフィールド村',
    position: { x: 14, y: 11 },
  },
  {
    kind: 'equipment-shop',
    mapId: JS_VILLAGE_MAP_ID,
    label: '装備屋',
    actionLabel: '装備屋を見る',
    locationLabel: 'グリーンフィールド村',
    position: { x: 15, y: 11 },
  },
  {
    kind: 'inn',
    mapId: JS_FOREST_SETTLEMENT_MAP_ID,
    label: '宿',
    actionLabel: '森番の宿で休む',
    locationLabel: '森番の集落',
    checkpointId: 'forest-settlement',
    position: { x: 7, y: 11 },
  },
  {
    kind: 'item-shop',
    mapId: JS_FOREST_SETTLEMENT_MAP_ID,
    label: '道具屋',
    actionLabel: '補給所を見る',
    locationLabel: '森番の集落',
    position: { x: 15, y: 11 },
  },
] as const

export function getVillageFacilityAtPosition(
  mapId: WorldMapId,
  position: { x: number; y: number },
): VillageFacility | undefined {
  return VILLAGE_FACILITIES.find(
    (facility) =>
      facility.mapId === mapId &&
      facility.position.x === position.x &&
      facility.position.y === position.y,
  )
}
