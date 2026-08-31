import { describe, expect, it } from 'vitest'
import {
  areaById,
  areas,
  availableAreas,
  getAreaCapability,
  getAreasForWorldMap,
  getBattleRoutePath,
  JAVASCRIPT_AREA_ID,
  parseBattleRoute,
  TYPESCRIPT_AREA_ID,
  type AreaDefinition,
} from './areas'
import { battles } from './battles'
import { getAreaBattleSequence, getProgressionNode } from '../progression'

describe('area definitions', () => {
  it('registry order and incident-first story resolver follow the canonical graph', () => {
    expect(areaById.javascript.battleIds).toEqual(getAreaBattleSequence('javascript'))
    expect(areaById.typescript.battleIds).toEqual(getAreaBattleSequence('typescript'))
    expect(areaById.javascript.storyEvent?.(1, 'pre')?.id).toBe('js-before-first-incident-field-observation')
    expect(areaById.javascript.storyEvent?.(9, 'post')?.id).toBe('js-training-complete-return-to-trace')
  })

  it('Area idが一意でlookupと一致する', () => {
    expect(new Set(areas.map((area) => area.id)).size).toBe(areas.length)

    for (const area of areas) {
      expect(areaById[area.id]).toBe(area)
      expect(area.routes.battleBase).toBe(`/${area.id}/battle`)
      if (area.capabilities.story) expect(area.storyEvent).toBeTypeOf('function')
    }
  })

  it('available AreaだけがField入口とcross-cutting capabilityを持つ', () => {
    expect(availableAreas.map((area) => area.id)).toEqual([
      JAVASCRIPT_AREA_ID,
      TYPESCRIPT_AREA_ID,
    ])

    for (const area of areas) {
      if (area.availability === 'available') {
        expect(area.routes.field).not.toBeNull()
        expect(Object.values(area.capabilities).every(Boolean)).toBe(true)
      } else {
        expect(area.routes.field).toBeNull()
      }
    }
  })

  it('Area選択から直接Fieldへ入る', () => {
    expect(areaById[JAVASCRIPT_AREA_ID]).toMatchObject({
      availability: 'available',
      routes: {
        field: '/javascript/field',
        world: '/world',
        battleBase: '/javascript/battle',
      },
      bossBattleId: 3,
    })
    expect(areaById[TYPESCRIPT_AREA_ID]).toMatchObject({
      availability: 'available',
      routes: {
        field: '/typescript/field',
        world: '/world',
        battleBase: '/typescript/battle',
      },
      bossBattleId: 6,
    })
  })

  it('全Battleが一つのAreaに登録されroute/capabilityを導出できる', () => {
    const registeredBattleIds = areas.flatMap((area) => area.battleIds)
    expect(new Set(registeredBattleIds).size).toBe(registeredBattleIds.length)
    expect([...registeredBattleIds].sort((a, b) => a - b)).toEqual(
      battles.map((battle) => battle.id).sort((a, b) => a - b),
    )

    for (const battle of battles) {
      expect(getProgressionNode(battle.id)?.area).toBe(battle.areaId)
      const path = getBattleRoutePath(battle.areaId, battle.id)
      expect(path).toBeDefined()
      expect(parseBattleRoute(path ?? '')).toMatchObject({
        area: { id: battle.areaId },
        battleId: battle.id,
      })
      expect(getAreaCapability(battle.areaId, 'codeData')).toBe(true)
      expect(getAreaCapability(battle.areaId, 'escape')).toBe(true)
      expect(getAreaCapability(battle.areaId, 'story')).toBe(true)
      expect(getAreaCapability(battle.areaId, 'tutorial')).toBe(true)
      for (const phase of ['pre', 'post'] as const) {
        const event = areaById[battle.areaId].storyEvent?.(battle.id, phase)
        for (const line of event?.lines ?? []) expect(line.speakerId).toBeTruthy()
      }
    }
  })

  it('第三Areaもregistry一件からrouteとsidecar capability/storyを接続できる', () => {
    const database: AreaDefinition = {
      id: 'database', label: 'WORLD 03', title: 'Database', description: 'test',
      availability: 'available',
      routes: { battleBase: '/database/battle', field: '/database/field', world: '/world' },
      battleIds: [101], worldMapIds: ['database'], bossBattleId: 101,
      capabilities: { codeData: true, escape: true, tutorial: true, story: true },
      storyEvent: () => ({ id: 'database-intro', label: 'TEST', title: 'TEST', lines: [] }),
    }
    const registry = [...areas, database]
    const route = parseBattleRoute('/database/battle/101', registry)
    expect(route?.area).toBe(database)
    expect(route?.area.capabilities).toEqual(database.capabilities)
    expect(route?.area.storyEvent?.(101, 'pre')?.id).toBe('database-intro')
    expect(getBattleRoutePath('database', 101, registry)).toBe('/database/battle/101')
  })

  it('unregistered・malformed battle routeをrejectする', () => {
    expect(parseBattleRoute('/javascript/battle/999')).toBeNull()
    expect(parseBattleRoute('/javascript/battle/7/more')).toBeNull()
    expect(parseBattleRoute('/database/battle/1')).toBeNull()
    expect(getBattleRoutePath('unknown', 1)).toBeUndefined()
  })

  it('shared overworldを含むmap ownershipをregistryから引ける', () => {
    expect(getAreasForWorldMap('overworld').map((area) => area.id)).toEqual([
      JAVASCRIPT_AREA_ID,
      TYPESCRIPT_AREA_ID,
    ])
    expect(getAreasForWorldMap('ts-frontier').map((area) => area.id)).toEqual([
      TYPESCRIPT_AREA_ID,
    ])
  })
})
