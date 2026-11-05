import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState, restoreRpgState, serializeRpgState } from '../rpg/state'
import { WorldAtlas } from '../ui/WorldAtlas'
import { DATABASE_SHELVES } from './databaseArchive'
import { VILLAGE_FACILITIES } from './villageFacilityData'
import { resolveWorldMove } from './worldActions'
import { getWorldFollowerPosition } from './worldFollowers'
import {
  getTerrain,
  getWorldPortalAtPosition,
  isWalkableTerrain,
  WORLD_MAP_STARTS,
} from './worldMap'
import { WorldSceneryLayer } from './WorldScenery'
import { WORLD_BUILDINGS, WORLD_LOG_BRIDGES } from './worldStructures'

describe('physical World objects', () => {
  it('each complete building shares its footprint with collision, and each shop door is on the accessible south facade', () => {
    for (const building of WORLD_BUILDINGS) {
      const { bounds } = building
      for (let y = bounds.top; y <= bounds.bottom; y += 1) {
        for (let x = bounds.left; x <= bounds.right; x += 1) {
          expect(getTerrain(x, y, building.mapId)).toBe('house')
          expect(isWalkableTerrain(getTerrain(x, y, building.mapId))).toBe(false)
        }
      }
      const html = renderToStaticMarkup(
        createElement(WorldSceneryLayer, {
          mapId: building.mapId,
          viewportStart: { x: bounds.left, y: bounds.top },
        }),
      )
      expect(html.match(new RegExp(`data-world-building="${building.id}"`, 'g'))).toHaveLength(1)
      if (!building.entrance) continue
      expect(building.entrance.y).toBe(bounds.bottom)
      expect(
        isWalkableTerrain(getTerrain(building.entrance.x, building.entrance.y + 1, building.mapId)),
      ).toBe(true)
      expect(html).toContain(`data-building-door="${building.entrance.x}:${building.entrance.y}"`)
    }
    for (const facility of VILLAGE_FACILITIES) {
      expect(
        WORLD_BUILDINGS.some(
          (building) =>
            building.mapId === facility.mapId &&
            building.entrance?.x === facility.position.x &&
            building.entrance.y === facility.position.y,
        ),
      ).toBe(true)
    }
  })

  it('all actual river crossings, including Deep Forest, have a continuous log object over the two walkable water cells', () => {
    for (const bridge of WORLD_LOG_BRIDGES) {
      const { bounds } = bridge
      for (let x = bounds.left; x <= bounds.right; x += 1) {
        expect(getTerrain(x, bounds.top, bridge.mapId)).toBe('log-crossing')
        expect(getTerrain(x, bounds.top - 1, bridge.mapId)).toBe('water')
        expect(getTerrain(x, bounds.top + 1, bridge.mapId)).toBe('water')
      }
      expect(isWalkableTerrain('log-crossing')).toBe(true)
      const html = renderToStaticMarkup(
        createElement(WorldSceneryLayer, {
          mapId: bridge.mapId,
          viewportStart: { x: bounds.left - 3, y: bounds.top - 3 },
        }),
      )
      expect(html.match(/data-world-bridge="log"/g)).toHaveLength(1)
    }
  })

  it('archive walls, furniture and stairs retain their actual meaning in the field and Atlas', () => {
    expect(getTerrain(18, 6, 'database-archive')).toBe('wall')
    expect(getTerrain(15, 4, 'database-archive')).toBe('lectern')
    expect(getTerrain(9, 13, 'database-archive')).toBe('stairs-up')
    expect(getTerrain(27, 16, 'ts-frontier')).toBe('stairs-down')
    for (const shelf of DATABASE_SHELVES)
      expect(getTerrain(shelf.left, shelf.top, 'database-archive')).toBe('bookshelf')
    for (const terrain of ['wall', 'bookshelf', 'lectern'] as const)
      expect(isWalkableTerrain(terrain)).toBe(false)
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: 'database-archive' as const,
      worldPosition: { x: 15, y: 5 },
      revealedWorldCells: { 'database-archive': ['15:4', '9:13', '18:6', '11:3'] },
    }
    const html = renderToStaticMarkup(
      createElement(WorldAtlas, { rpgState, progress: createInitialPlayerProgress() }),
    )
    expect(html).toContain('aria-label="台帳の閲覧台"')
    expect(html).toContain('aria-label="上り階段"')
    expect(html).not.toContain('aria-label="訓練所"')
    expect(html).not.toContain('terrain-mountain')
    expect(html).not.toContain('terrain-house')
  })

  it('the follower leaves stairs and shelves visible, and a recruited BYTE no longer leaves an invisible obstacle', () => {
    const stairFollower = getWorldFollowerPosition(
      'database-archive',
      { x: 9, y: 12 },
      { x: 9, y: 13 },
    )!
    expect(getWorldPortalAtPosition('database-archive', stairFollower)).toBeUndefined()
    expect(stairFollower).not.toEqual({ x: 9, y: 13 })
    const shelfFollower = getWorldFollowerPosition(
      'database-archive',
      { x: 12, y: 5 },
      { x: 12, y: 4 },
    )!
    expect(
      isWalkableTerrain(getTerrain(shelfFollower.x, shelfFollower.y, 'database-archive')),
    ).toBe(true)
    const state = {
      ...createInitialRpgState(),
      partyMemberIds: ['byte'],
      worldPosition: { x: 20, y: 13 },
    }
    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: -1,
      dy: 0,
    })
    expect(result.kind).toBe('moved')
    expect(result.nextState.worldPosition).toEqual({ x: 19, y: 13 })
  })

  it('keeps old village save positions while new arrivals and checkpoint identities use the boundary gate', () => {
    const old = {
      ...createInitialRpgState(),
      worldMapId: 'js-village' as const,
      worldPosition: { x: 10, y: 12 },
      currentHp: 57,
    }
    const restored = restoreRpgState(serializeRpgState(old))
    expect(restored.worldPosition).toEqual(old.worldPosition)
    expect(restored.currentHp).toBe(57)
    expect(getTerrain(10, 14, 'js-village')).toBe('road')
    expect(getWorldPortalAtPosition('js-village', { x: 10, y: 24 })?.toMapId).toBe('overworld')
    expect(WORLD_MAP_STARTS['js-village']).toEqual({ x: 10, y: 23 })
  })
})
