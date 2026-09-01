import { JAVASCRIPT_BATTLE_SEQUENCE, TYPESCRIPT_BATTLE_SEQUENCE } from '../progression/progressionGraph'

export const JAVASCRIPT_AREA_ID = 'javascript' as const
export const TYPESCRIPT_AREA_ID = 'typescript' as const

export type AreaAvailability = 'available' | 'comingSoon'
export type AreaRoutePath = `/${string}/field`
export type BattleBasePath = `/${string}/battle`

export type AreaRoutes = {
  /** Legacy bookmark target. Current exploration always returns to /world. */
  field: AreaRoutePath | null
  world: '/world'
  battleBase: BattleBasePath
}

export type AreaCapabilities = {
  codeData: boolean
  escape: boolean
  story: boolean
  tutorial: boolean
}

export type AreaDefinition = {
  id: string
  label: string
  title: string
  description: string
  availability: AreaAvailability
  routes: AreaRoutes
  battleIds: readonly number[]
  worldMapIds: readonly string[]
  capabilities: AreaCapabilities
  bossBattleId: number
  clearRewardEquipmentId?: string
  storyEvent?: (battleId: number, phase: 'pre' | 'post') => BattleStoryEvent | undefined
}

const sharedBattleCapabilities: AreaCapabilities = {
  codeData: true,
  escape: true,
  story: true,
  tutorial: true,
}

export const areas: readonly AreaDefinition[] = [
  {
    id: JAVASCRIPT_AREA_ID,
    label: 'WORLD 01',
    title: 'JavaScript Kingdom',
    description: '配列操作のコードを読み、敵の対象と優先順位を見抜く王国。',
    availability: 'available',
    routes: {
      field: '/javascript/field',
      world: '/world',
      battleBase: '/javascript/battle',
    },
    battleIds: JAVASCRIPT_BATTLE_SEQUENCE,
    worldMapIds: ['overworld', 'js-village', 'js-forest', 'js-deep-forest'],
    capabilities: sharedBattleCapabilities,
    bossBattleId: 3,
    clearRewardEquipmentId: 'branch-saber',
    storyEvent: (battleId: number, phase: 'pre' | 'post') =>
      getJavaScriptCharacterStoryEvent(battleId, phase) ??
      getJavaScriptIncidentOpeningEvent(battleId, phase) ??
      getJavaScriptDeepForestStoryEvent(battleId, phase) ??
      getJavaScriptFilterStoryEvent(battleId, phase) ??
      getJavaScriptMidbossStoryEvent(battleId, phase) ??
      (phase === 'pre' ? getJavaScriptPreBattleEvent(battleId) : getJavaScriptPostBattleEvent(battleId)),
  },
  {
    id: TYPESCRIPT_AREA_ID,
    label: 'WORLD 02',
    title: 'TypeScript Frontier',
    description: '型注釈・union・narrowingを手がかりに、実行結果まで追う辺境地。',
    availability: 'available',
    routes: {
      field: '/typescript/field',
      world: '/world',
      battleBase: '/typescript/battle',
    },
    battleIds: TYPESCRIPT_BATTLE_SEQUENCE,
    worldMapIds: ['overworld', 'ts-frontier'],
    capabilities: sharedBattleCapabilities,
    bossBattleId: 6,
    clearRewardEquipmentId: 'typed-mail',
    storyEvent: (battleId: number, phase: 'pre' | 'post') =>
      getTypeScriptCharacterStoryEvent(battleId, phase) ??
      (phase === 'pre' ? getTypeScriptPreBattleEvent(battleId) : getTypeScriptPostBattleEvent(battleId)),
  },
]

export type AreaId = (typeof areas)[number]['id']

export const areaById = Object.fromEntries(areas.map((area) => [area.id, area])) as Record<
  string,
  AreaDefinition
>

export const availableAreas = areas.filter((area) => area.availability === 'available')

export type BattleRouteMatch = {
  area: AreaDefinition
  battleId: number
}

export function getAreaDefinition(areaId: string, definitions: readonly AreaDefinition[] = areas): AreaDefinition | undefined {
  return definitions.find((area) => area.id === areaId)
}

export function getAreasForWorldMap(worldMapId: string): AreaDefinition[] {
  return areas.filter((area) => area.worldMapIds.some((mapId) => mapId === worldMapId))
}

export function getAreaCapability(
  areaId: string,
  capability: keyof AreaCapabilities,
): boolean {
  return getAreaDefinition(areaId)?.capabilities[capability] ?? false
}

export function getBattleRoutePath(areaId: string, battleId: number, definitions: readonly AreaDefinition[] = areas): string | undefined {
  const area = getAreaDefinition(areaId, definitions)
  if (!area || !Number.isInteger(battleId) || !area.battleIds.some((id) => id === battleId)) {
    return undefined
  }
  return `${area.routes.battleBase}/${battleId}`
}

/**
 * Parses registered battle routes without encoding the current Area ids in a route regex.
 * A future Area therefore joins every cross-cutting route consumer through this registry.
 */
export function parseBattleRoute(pathname: string, definitions: readonly AreaDefinition[] = areas): BattleRouteMatch | null {
  for (const area of definitions) {
    const prefix = `${area.routes.battleBase}/`
    if (!pathname.startsWith(prefix)) continue

    const idSegment = pathname.slice(prefix.length)
    if (!/^\d+$/.test(idSegment)) return null
    const battleId = Number(idSegment)
    if (!area.battleIds.some((id) => id === battleId)) return null
    return { area, battleId }
  }

  return null
}
import {
  getJavaScriptCharacterStoryEvent,
  getTypeScriptCharacterStoryEvent,
} from '../story/characterStoryOverrides'
import { getJavaScriptPostBattleEvent, getJavaScriptPreBattleEvent } from '../story/javascriptBattleEvents'
import { getJavaScriptDeepForestStoryEvent } from '../story/javascriptDeepForestEvents'
import { getJavaScriptFilterStoryEvent } from '../story/javascriptFilterEvents'
import { getJavaScriptIncidentOpeningEvent } from '../story/javascriptIncidentOpeningEvents'
import { getJavaScriptMidbossStoryEvent } from '../story/javascriptMidbossEvents'
import { getTypeScriptPostBattleEvent, getTypeScriptPreBattleEvent } from '../story/typescriptBattleEvents'
import type { BattleStoryEvent } from '../story/types'