import { getDialogueForNpc } from '../dialogue/dialogue'
import { npcById } from '../dialogue/npcs'
import type { DialogueEntry, NpcDefinition } from '../dialogue/types'
import {
  isAdjacent,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  TS_FRONTIER_MAP_ID,
  type WorldMapId,
} from './worldMap'

export type WorldNpcPlacement = {
  npcId: string
  mapId: WorldMapId
  position: { x: number; y: number }
  optional: boolean
  storyThread?: string
}

export const WORLD_NPC_PLACEMENTS: readonly WorldNpcPlacement[] = [
  {
    npcId: 'trainer-mio',
    mapId: JS_VILLAGE_MAP_ID,
    position: JS_VILLAGE_TRAINING_POSITION,
    optional: false,
  },
  {
    npcId: 'village-child',
    mapId: JS_VILLAGE_MAP_ID,
    position: { x: 8, y: 18 },
    optional: true,
    storyThread: 'greenfield-life',
  },
  {
    npcId: 'forest-traveler',
    mapId: JS_VILLAGE_MAP_ID,
    position: { x: 24, y: 13 },
    optional: true,
    storyThread: 'forest-road',
  },
  {
    npcId: 'misfire-adventurer',
    mapId: JS_VILLAGE_MAP_ID,
    position: { x: 7, y: 10 },
    optional: true,
    storyThread: 'forest-road',
  },
  {
    npcId: 'type-warden',
    mapId: TS_FRONTIER_MAP_ID,
    position: { x: 30, y: 6 },
    optional: true,
    storyThread: 'frontier-warden',
  },
] as const

export function getWorldNpcAtPosition(
  mapId: WorldMapId,
  position: { x: number; y: number },
): WorldNpcPlacement | undefined {
  return WORLD_NPC_PLACEMENTS.find(
    (placement) =>
      placement.mapId === mapId &&
      placement.position.x === position.x &&
      placement.position.y === position.y,
  )
}

export function getAdjacentWorldNpc(
  mapId: WorldMapId,
  position: { x: number; y: number },
): WorldNpcPlacement | undefined {
  return WORLD_NPC_PLACEMENTS.find(
    (placement) => placement.mapId === mapId && isAdjacent(position, placement.position),
  )
}

export function getWorldNpcDefinition(placement: WorldNpcPlacement): NpcDefinition {
  const npc = npcById[placement.npcId]
  if (!npc) throw new Error(`World NPC ${placement.npcId} has no dialogue definition`)
  return npc
}

export function getWorldNpcDialogue(
  placement: WorldNpcPlacement,
  progress: { clearedStageIds: number[]; clearedAreaIds: string[] },
): { npc: NpcDefinition; dialogue: DialogueEntry } {
  const npc = getWorldNpcDefinition(placement)
  return {
    npc,
    dialogue: getDialogueForNpc(npc, {
      level: 1,
      clearedStageIds: progress.clearedStageIds,
      clearedAreaIds: progress.clearedAreaIds,
    }),
  }
}

export function getWorldNpcPlacementsForMap(mapId: WorldMapId): readonly WorldNpcPlacement[] {
  return WORLD_NPC_PLACEMENTS.filter((placement) => placement.mapId === mapId)
}
