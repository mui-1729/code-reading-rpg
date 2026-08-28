import { describe, expect, it } from 'vitest'
import {
  getEncounterBattleId,
  getTerrain,
  getTreasureAtPosition,
  getVisibleWorldCells,
  getWorldMapDimensions,
  getWorldMapLabel,
  getWorldPortalAtPosition,
  getWorldRegion,
  isEncounterTerrain,
  isWalkableTerrain,
  isWorldPositionInBounds,
  JS_BOSS_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_POSITION,
  OVERWORLD_MAP_ID,
  TS_BOSS_POSITION,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_TREASURES,
} from './worldMap'

describe('open world map', () => {
  it('画面より大きいWorldからPlayer周辺だけをviewportへ切り出す', () => {
    const cells = getVisibleWorldCells({ x: 20, y: 14 })
    expect(cells).toHaveLength(VIEWPORT_WIDTH * VIEWPORT_HEIGHT)
    expect(new Set(cells.map((cell) => `${cell.x}:${cell.y}`)).size).toBe(cells.length)
  })

  it('OverworldとVillageをstable map ID / boundsで管理する', () => {
    expect(getWorldMapDimensions(OVERWORLD_MAP_ID)).toEqual({ width: 40, height: 28 })
    expect(getWorldMapDimensions(JS_VILLAGE_MAP_ID)).toEqual({ width: 21, height: 15 })
    expect(getWorldMapLabel(JS_VILLAGE_MAP_ID)).toBe('GREENFIELD VILLAGE')
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 10, y: 12 })).toBe(true)
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 21, y: 12 })).toBe(false)
  })

  it('Village入口と出口をportalとして定義する', () => {
    const entrance = getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_VILLAGE_POSITION)
    expect(entrance).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: JS_VILLAGE_MAP_ID,
      targetPosition: { x: 10, y: 12 },
    })

    const exit = getWorldPortalAtPosition(JS_VILLAGE_MAP_ID, { x: 10, y: 14 })
    expect(exit).toMatchObject({
      fromMapId: JS_VILLAGE_MAP_ID,
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 14, y: 13 },
    })
  })

  it('左をJavaScript、中央をHub、右をTypeScriptとして扱う', () => {
    expect(getWorldRegion(8)).toBe('javascript')
    expect(getWorldRegion(20)).toBe('hub')
    expect(getWorldRegion(32)).toBe('typescript')
    expect(getWorldRegion(10, JS_VILLAGE_MAP_ID)).toBe('javascript')
  })

  it('Bossは固定地点で、地域ごとのEncounter terrainだけがRandom Encounter対象になる', () => {
    expect(getTerrain(JS_BOSS_POSITION.x, JS_BOSS_POSITION.y)).toBe('boss')
    expect(getTerrain(TS_BOSS_POSITION.x, TS_BOSS_POSITION.y)).toBe('boss')
    expect(isWalkableTerrain('boss')).toBe(false)
    expect(isEncounterTerrain('tall-grass')).toBe(true)
    expect(isEncounterTerrain('woods')).toBe(true)
    expect(isEncounterTerrain('deep-woods')).toBe(true)
    expect(isEncounterTerrain('forest')).toBe(true)
    expect(isEncounterTerrain('road')).toBe(false)
    expect(isEncounterTerrain('town')).toBe(false)
  })

  it('Villageのhouseは歩けず、road / exitは歩ける', () => {
    expect(getTerrain(0, 0, JS_VILLAGE_MAP_ID)).toBe('house')
    expect(getTerrain(10, 7, JS_VILLAGE_MAP_ID)).toBe('road')
    expect(getTerrain(10, 14, JS_VILLAGE_MAP_ID)).toBe('exit')
    expect(isWalkableTerrain('house')).toBe(false)
    expect(isWalkableTerrain('road')).toBe(true)
    expect(isWalkableTerrain('exit')).toBe(true)
  })

  it('JS / TSに1つずつTreasureを置き、直接は踏めないWorld objectとして扱う', () => {
    expect(WORLD_TREASURES).toHaveLength(2)
    expect(WORLD_TREASURES.map((treasure) => treasure.region)).toEqual([
      'javascript',
      'typescript',
    ])

    for (const treasure of WORLD_TREASURES) {
      expect(getTerrain(treasure.position.x, treasure.position.y)).toBe('treasure')
      expect(getTreasureAtPosition(treasure.position)?.id).toBe(treasure.id)
    }
    expect(isWalkableTerrain('treasure')).toBe(false)
  })

  it('未クリアの通常Battleを優先し、クリア後は地域内Battleを再Encounterできる', () => {
    expect(getEncounterBattleId('javascript', [1, 4], [], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 2], [1], 0.2)).toBe(2)
    expect(getEncounterBattleId('javascript', [1, 4, 2, 3], [1, 2], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 2, 3], [1, 2], 0.8)).toBe(2)

    expect(getEncounterBattleId('typescript', [1, 4], [], 0.2)).toBe(4)
    expect(getEncounterBattleId('typescript', [1, 4, 5], [4], 0.2)).toBe(5)
    expect(getEncounterBattleId('hub', [1, 4], [], 0.2)).toBeNull()
  })
})
