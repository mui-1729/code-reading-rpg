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
  JS_DEEP_FOREST_CORE_EXIT_POSITION,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_FOREST_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_POSITION,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
  TS_BOSS_POSITION,
  TS_FRONTIER_GATE_POSITION,
  TS_FRONTIER_MAP_ID,
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

  it('Overworld / JS local maps / TS Frontierをstable map ID / boundsで管理する', () => {
    expect(getWorldMapDimensions(OVERWORLD_MAP_ID)).toEqual({ width: 40, height: 28 })
    expect(getWorldMapDimensions(JS_VILLAGE_MAP_ID)).toEqual({ width: 21, height: 15 })
    expect(getWorldMapDimensions(JS_FOREST_MAP_ID)).toEqual({ width: 31, height: 27 })
    expect(getWorldMapDimensions(JS_DEEP_FOREST_MAP_ID)).toEqual({ width: 31, height: 27 })
    expect(getWorldMapDimensions(TS_FRONTIER_MAP_ID)).toEqual({ width: 31, height: 21 })
    expect(getWorldMapLabel(JS_VILLAGE_MAP_ID)).toBe('グリーンフィールド村')
    expect(getWorldMapLabel(JS_FOREST_MAP_ID)).toBe('JavaScriptの森')
    expect(getWorldMapLabel(TS_FRONTIER_MAP_ID)).toBe('TypeScript辺境')
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 10, y: 12 })).toBe(true)
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 21, y: 12 })).toBe(false)
    expect(isWorldPositionInBounds(JS_FOREST_MAP_ID, { x: 28, y: 24 })).toBe(true)
    expect(isWorldPositionInBounds(JS_FOREST_MAP_ID, { x: 31, y: 10 })).toBe(false)
    expect(isWorldPositionInBounds(TS_FRONTIER_MAP_ID, { x: 27, y: 4 })).toBe(true)
  })

  it('Village / Forest / Deep Forest / TypeScript Frontierの入口と出口をportalとして定義する', () => {
    const villageEntrance = getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_VILLAGE_POSITION)
    expect(villageEntrance).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: JS_VILLAGE_MAP_ID,
      targetPosition: { x: 10, y: 12 },
      requiredClearedStageId: 1,
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

    const coreExit = getWorldPortalAtPosition(JS_DEEP_FOREST_MAP_ID, JS_DEEP_FOREST_CORE_EXIT_POSITION)
    expect(coreExit).toMatchObject({
      fromMapId: JS_DEEP_FOREST_MAP_ID,
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 8, y: 6 },
      requiredClearedStageId: 22,
      label: 'Code Core前',
    })

    const typeScriptGate = getWorldPortalAtPosition(OVERWORLD_MAP_ID, TS_FRONTIER_GATE_POSITION)
    expect(typeScriptGate).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: TS_FRONTIER_MAP_ID,
      targetPosition: { x: 2, y: 10 },
      requiredClearedStageId: 3,
    })
    expect(getWorldPortalAtPosition(TS_FRONTIER_MAP_ID, { x: 1, y: 10 })).toMatchObject({
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 22, y: 14 },
    })
  })

  it('Overworldの左右regionとlocal mapのregionを分離して扱う', () => {
    expect(getWorldRegion(8)).toBe('javascript')
    expect(getWorldRegion(20)).toBe('hub')
    expect(getWorldRegion(32)).toBe('typescript')
    expect(getWorldRegion(10, JS_VILLAGE_MAP_ID)).toBe('javascript')
    expect(getWorldRegion(28, JS_FOREST_MAP_ID)).toBe('javascript')
    expect(getWorldRegion(2, TS_FRONTIER_MAP_ID)).toBe('typescript')
  })

  it('Bossは地域mapの固定地点で、地域ごとのEncounter terrainだけがRandom Encounter対象になる', () => {
    expect(getTerrain(JS_BOSS_POSITION.x, JS_BOSS_POSITION.y, OVERWORLD_MAP_ID)).toBe('boss')
    expect(getTerrain(TS_BOSS_POSITION.x, TS_BOSS_POSITION.y, TS_FRONTIER_MAP_ID)).toBe('boss')
    expect(isWalkableTerrain('boss')).toBe(false)
    expect(isEncounterTerrain('tall-grass')).toBe(true)
    expect(isEncounterTerrain('woods')).toBe(true)
    expect(isEncounterTerrain('deep-woods')).toBe(true)
    expect(isEncounterTerrain('crystal')).toBe(true)
    expect(isEncounterTerrain('ruins')).toBe(true)
    expect(isEncounterTerrain('road')).toBe(false)
    expect(isEncounterTerrain('stone')).toBe(false)
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

  it('Forestは東西のmain trailを維持しつつ南側へ安全な寄り道を持つ', () => {
    expect(getTerrain(28, 10, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(22, 6, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(18, 6, JS_FOREST_MAP_ID)).toBe('water')
    expect(['woods', 'deep-woods', 'grass']).toContain(getTerrain(25, 8, JS_FOREST_MAP_ID))
    expect(getTerrain(24, 18, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(21, 20, JS_FOREST_MAP_ID)).toBe('road')
    expect(isEncounterTerrain(getTerrain(24, 18, JS_FOREST_MAP_ID))).toBe(false)
    expect(getTerrain(30, 10, JS_FOREST_MAP_ID)).toBe('exit')
  })

  it('Deep Forestも固定Lessonの東西trailを維持しつつ南側へ探索branchを持つ', () => {
    expect(getTerrain(28, 10, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(10, 20, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(13, 22, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(isEncounterTerrain(getTerrain(10, 20, JS_DEEP_FOREST_MAP_ID))).toBe(false)
    expect(['woods', 'deep-woods']).toContain(getTerrain(8, 20, JS_DEEP_FOREST_MAP_ID))
    expect(getTerrain(JS_DEEP_FOREST_CORE_EXIT_POSITION.x, JS_DEEP_FOREST_CORE_EXIT_POSITION.y, JS_DEEP_FOREST_MAP_ID)).toBe('exit')
  })

  it('TypeScript Frontierはstone / crystal / ruins / gateでJS自然mapと別visual domainを持つ', () => {
    expect(getTerrain(2, 10, TS_FRONTIER_MAP_ID)).toBe('stone')
    expect(getTerrain(1, 10, TS_FRONTIER_MAP_ID)).toBe('gate')
    expect(['crystal', 'ruins']).toContain(getTerrain(6, 8, TS_FRONTIER_MAP_ID))
  })

  it('Village入口へ向かう縦道はEncounterなしのroadとして確保する', () => {
    expect(getTerrain(14, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(14, 13, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(14, 12, OVERWORLD_MAP_ID)).toBe('village')
  })

  it('各地方のTreasureを直接踏めないWorld objectとして扱い、JS寄り道にも探索理由を置く', () => {
    expect(WORLD_TREASURES).toHaveLength(4)
    expect(WORLD_TREASURES.filter((treasure) => treasure.region === 'javascript')).toHaveLength(3)
    expect(WORLD_TREASURES.filter((treasure) => treasure.region === 'typescript')).toHaveLength(1)

    for (const treasure of WORLD_TREASURES) {
      expect(getTerrain(treasure.position.x, treasure.position.y, treasure.mapId)).toBe('treasure')
      expect(getTreasureAtPosition(treasure.position, treasure.mapId)?.id).toBe(treasure.id)
    }
    expect(getTerrain(21, 20, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(13, 22, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(isWalkableTerrain('treasure')).toBe(false)
  })

  it('Overworld / Frontierでは未クリアの通常Battleを優先し、クリア後は地域内Battleを再Encounterできる', () => {
    expect(getEncounterBattleId('javascript', [1, 4, 7], [], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2], [1], 0.2)).toBe(2)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2, 3], [1, 2], 0.2)).toBe(1)
    expect(getEncounterBattleId('javascript', [1, 4, 7, 2, 3], [1, 2], 0.8)).toBe(2)

    expect(getEncounterBattleId('typescript', [1, 4, 7], [], 0.2, TS_FRONTIER_MAP_ID)).toBe(4)
    expect(getEncounterBattleId('typescript', [1, 4, 7, 5], [4], 0.2, TS_FRONTIER_MAP_ID)).toBe(5)
    expect(getEncounterBattleId('hub', [1, 4, 7], [], 0.2)).toBeNull()
  })

  it('Forest Random Encounterは固定Lessonでclear済みのBattleだけを反復する', () => {
    expect(getEncounterBattleId('javascript', [10], [7, 8], 0.9, JS_FOREST_MAP_ID)).toBeNull()
    expect(getEncounterBattleId('javascript', [10], [7, 8, 9, 1], 0.9, JS_FOREST_MAP_ID)).toBeNull()

    expect(getEncounterBattleId('javascript', [10, 11], [7, 8, 9, 1, 10], 0.2, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11], [7, 8, 9, 1, 10], 0.9, JS_FOREST_MAP_ID)).toBe(10)

    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11], 0.2, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11], 0.9, JS_FOREST_MAP_ID)).toBe(11)

    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11, 12], 0.1, JS_FOREST_MAP_ID)).toBe(10)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11, 12], 0.5, JS_FOREST_MAP_ID)).toBe(11)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11, 12], 0.9, JS_FOREST_MAP_ID)).toBe(12)
  })
})
