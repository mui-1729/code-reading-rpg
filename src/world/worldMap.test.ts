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
  JS_FOREST_MAP_ID,
  JS_FOREST_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_POSITION,
  JS_VILLAGE_TRAINING_POSITION,
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

  it('Overworld / Village / Forestをstable map ID / boundsで管理する', () => {
    expect(getWorldMapDimensions(OVERWORLD_MAP_ID)).toEqual({ width: 40, height: 28 })
    expect(getWorldMapDimensions(JS_VILLAGE_MAP_ID)).toEqual({ width: 21, height: 15 })
    expect(getWorldMapDimensions(JS_FOREST_MAP_ID)).toEqual({ width: 31, height: 21 })
    expect(getWorldMapLabel(JS_VILLAGE_MAP_ID)).toBe('GREENFIELD VILLAGE')
    expect(getWorldMapLabel(JS_FOREST_MAP_ID)).toBe('JAVASCRIPT FOREST')
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 10, y: 12 })).toBe(true)
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 21, y: 12 })).toBe(false)
    expect(isWorldPositionInBounds(JS_FOREST_MAP_ID, { x: 28, y: 10 })).toBe(true)
    expect(isWorldPositionInBounds(JS_FOREST_MAP_ID, { x: 31, y: 10 })).toBe(false)
  })

  it('VillageとForestの入口 / 出口をportalとして定義する', () => {
    const villageEntrance = getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_VILLAGE_POSITION)
    expect(villageEntrance).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: JS_VILLAGE_MAP_ID,
      targetPosition: { x: 10, y: 12 },
    })

    const villageExit = getWorldPortalAtPosition(JS_VILLAGE_MAP_ID, { x: 10, y: 14 })
    expect(villageExit).toMatchObject({
      fromMapId: JS_VILLAGE_MAP_ID,
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 14, y: 13 },
    })

    const forestEntrance = getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_FOREST_POSITION)
    expect(forestEntrance).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: JS_FOREST_MAP_ID,
      targetPosition: { x: 28, y: 10 },
      requiredClearedStageId: 9,
    })

    const forestExit = getWorldPortalAtPosition(JS_FOREST_MAP_ID, { x: 30, y: 10 })
    expect(forestExit).toMatchObject({
      fromMapId: JS_FOREST_MAP_ID,
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 8, y: 14 },
    })
  })

  it('左をJavaScript、中央をHub、右をTypeScriptとして扱う', () => {
    expect(getWorldRegion(8)).toBe('javascript')
    expect(getWorldRegion(20)).toBe('hub')
    expect(getWorldRegion(32)).toBe('typescript')
    expect(getWorldRegion(10, JS_VILLAGE_MAP_ID)).toBe('javascript')
    expect(getWorldRegion(28, JS_FOREST_MAP_ID)).toBe('javascript')
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

  it('Villageのhouse / TRAINは歩けず、road / exitは歩ける', () => {
    expect(getTerrain(0, 0, JS_VILLAGE_MAP_ID)).toBe('house')
    expect(getTerrain(10, 7, JS_VILLAGE_MAP_ID)).toBe('road')
    expect(
      getTerrain(
        JS_VILLAGE_TRAINING_POSITION.x,
        JS_VILLAGE_TRAINING_POSITION.y,
        JS_VILLAGE_MAP_ID,
      ),
    ).toBe('training')
    expect(getTerrain(10, 14, JS_VILLAGE_MAP_ID)).toBe('exit')
    expect(isWalkableTerrain('house')).toBe(false)
    expect(isWalkableTerrain('training')).toBe(false)
    expect(isWalkableTerrain('road')).toBe(true)
    expect(isWalkableTerrain('exit')).toBe(true)
  })

  it('Forestは東西のtrail / 川 / encounter terrainを持つ自然mapとして構成する', () => {
    expect(getTerrain(28, 10, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(22, 6, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(18, 6, JS_FOREST_MAP_ID)).toBe('water')
    expect(['woods', 'deep-woods', 'grass']).toContain(getTerrain(25, 8, JS_FOREST_MAP_ID))
    expect(getTerrain(30, 10, JS_FOREST_MAP_ID)).toBe('exit')
  })

  it('Village入口へ向かう縦道はEncounterなしのroadとして確保する', () => {
    expect(getTerrain(14, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(14, 13, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(14, 12, OVERWORLD_MAP_ID)).toBe('village')
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

  it('Overworldでは未クリアの通常Battleを優先し、クリア後は地域内Battleを再Encounterできる', () => {
    expect(getEncounterBattleId('javascript', [1, 4, 7], [], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2], [1], 0.2)).toBe(2)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2, 3], [1, 2], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2, 3], [1, 2], 0.8)).toBe(2)

    expect(getEncounterBattleId('typescript', [1, 4, 7], [], 0.2)).toBe(4)
    expect(getEncounterBattleId('typescript', [1, 4, 7, 5], [4], 0.2)).toBe(5)
    expect(getEncounterBattleId('hub', [1, 4, 7], [], 0.2)).toBeNull()
  })

  it('ForestではTraining 9後に10→11→12を段階的に混ぜて反復する', () => {
    expect(getEncounterBattleId('javascript', [10], [7, 8], 0.9, JS_FOREST_MAP_ID)).toBeNull()
    expect(getEncounterBattleId('javascript', [10], [7, 8, 9], 0.9, JS_FOREST_MAP_ID)).toBe(10)

    expect(getEncounterBattleId('javascript', [10, 11], [7, 8, 9, 10], 0.2, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11], [7, 8, 9, 10], 0.9, JS_FOREST_MAP_ID)).toBe(11)

    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11], 0.2, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11], 0.6, JS_FOREST_MAP_ID)).toBe(11)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11], 0.9, JS_FOREST_MAP_ID)).toBe(12)

    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11, 12], 0.1, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11, 12], 0.5, JS_FOREST_MAP_ID)).toBe(11)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 10, 11, 12], 0.9, JS_FOREST_MAP_ID)).toBe(12)
  })
})
