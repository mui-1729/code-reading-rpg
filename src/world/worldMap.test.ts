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

  it('OverworldをField scaleへ広げ、local mapとは別の縮尺で管理する', () => {
    expect(getWorldMapDimensions(OVERWORLD_MAP_ID)).toEqual({ width: 70, height: 50 })
    expect(getWorldMapDimensions(JS_VILLAGE_MAP_ID)).toEqual({ width: 21, height: 15 })
    expect(getWorldMapDimensions(JS_FOREST_MAP_ID)).toEqual({ width: 31, height: 27 })
    expect(getWorldMapDimensions(JS_DEEP_FOREST_MAP_ID)).toEqual({ width: 31, height: 27 })
    expect(getWorldMapDimensions(TS_FRONTIER_MAP_ID)).toEqual({ width: 31, height: 21 })
    expect(getWorldMapLabel(JS_VILLAGE_MAP_ID)).toBe('グリーンフィールド村')
    expect(getWorldMapLabel(JS_FOREST_MAP_ID)).toBe('JavaScriptの森')
    expect(getWorldMapLabel(TS_FRONTIER_MAP_ID)).toBe('TypeScript辺境')
    expect(isWorldPositionInBounds(OVERWORLD_MAP_ID, { x: 68, y: 48 })).toBe(true)
    expect(isWorldPositionInBounds(OVERWORLD_MAP_ID, { x: 70, y: 48 })).toBe(false)
    expect(isWorldPositionInBounds(JS_VILLAGE_MAP_ID, { x: 10, y: 12 })).toBe(true)
    expect(isWorldPositionInBounds(JS_FOREST_MAP_ID, { x: 28, y: 24 })).toBe(true)
  })

  it('Village / Forest / Deep Forest / TypeScript Frontierの入口と出口をportalとして定義する', () => {
    expect(getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_VILLAGE_POSITION)).toMatchObject({
      fromMapId: OVERWORLD_MAP_ID,
      toMapId: JS_VILLAGE_MAP_ID,
      targetPosition: { x: 10, y: 12 },
      requiredClearedStageId: 1,
    })
    expect(getWorldPortalAtPosition(JS_VILLAGE_MAP_ID, { x: 10, y: 14 })).toMatchObject({
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 10, y: 21 },
    })
    expect(getWorldPortalAtPosition(OVERWORLD_MAP_ID, JS_FOREST_POSITION)).toMatchObject({
      toMapId: JS_FOREST_MAP_ID,
      targetPosition: { x: 28, y: 10 },
      requiredClearedStageId: 9,
    })
    expect(getWorldPortalAtPosition(JS_FOREST_MAP_ID, { x: 30, y: 10 })).toMatchObject({
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 34, y: 33 },
    })
    expect(
      getWorldPortalAtPosition(JS_DEEP_FOREST_MAP_ID, JS_DEEP_FOREST_CORE_EXIT_POSITION),
    ).toMatchObject({
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 40, y: 8 },
      requiredClearedStageId: 22,
      label: 'Code Core前',
    })
    expect(getWorldPortalAtPosition(OVERWORLD_MAP_ID, TS_FRONTIER_GATE_POSITION)).toMatchObject({
      toMapId: TS_FRONTIER_MAP_ID,
      targetPosition: { x: 2, y: 10 },
      requiredClearedStageId: 3,
    })
    expect(getWorldPortalAtPosition(TS_FRONTIER_MAP_ID, { x: 1, y: 10 })).toMatchObject({
      toMapId: OVERWORLD_MAP_ID,
      targetPosition: { x: 61, y: 14 },
    })
  })

  it('OverworldはHub帯を挟み、JavaScript FieldとTypeScript側を長距離で分離する', () => {
    expect(getWorldRegion(10)).toBe('javascript')
    expect(getWorldRegion(20)).toBe('hub')
    expect(getWorldRegion(34)).toBe('javascript')
    expect(getWorldRegion(52)).toBe('typescript')
    expect(getWorldRegion(62)).toBe('typescript')
    expect(getWorldRegion(10, JS_VILLAGE_MAP_ID)).toBe('javascript')
    expect(getWorldRegion(28, JS_FOREST_MAP_ID)).toBe('javascript')
    expect(getWorldRegion(2, TS_FRONTIER_MAP_ID)).toBe('typescript')
  })

  it('Hub→Village→Forestのmain route自体が上下左右へ曲がり、川を橋で越える', () => {
    expect(JS_VILLAGE_POSITION).toEqual({ x: 10, y: 22 })
    expect(JS_FOREST_POSITION).toEqual({ x: 34, y: 34 })
    expect(getTerrain(18, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(12, 18, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(18, 22, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(25, 22, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(25, 24, OVERWORLD_MAP_ID)).toBe('water')
    expect(getTerrain(28, 27, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(25, 31, OVERWORLD_MAP_ID)).toBe('water')
    expect(getTerrain(31, 31, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(34, 33, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(34, 34, OVERWORLD_MAP_ID)).toBe('woods')
  })

  it('Village南側に川辺へ回ってmain routeへ戻れるoptional loopとTreasureを持つ', () => {
    expect(getTerrain(12, 30, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(9, 34, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(7, 29, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(9, 26, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(8, 33, OVERWORLD_MAP_ID)).toBe('treasure')
    expect(getTerrain(8, 37, OVERWORLD_MAP_ID)).toBe('water')
  })

  it('TypeScript境界はHub直横ではなくFieldの東端側にあり、道中でvisual domainが切り替わる', () => {
    expect(TS_FRONTIER_GATE_POSITION).toEqual({ x: 62, y: 14 })
    expect(getTerrain(40, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(51, 14, OVERWORLD_MAP_ID)).toBe('road')
    expect(getTerrain(52, 14, OVERWORLD_MAP_ID)).toBe('stone')
    expect(getTerrain(61, 14, OVERWORLD_MAP_ID)).toBe('stone')
    expect(getTerrain(62, 14, OVERWORLD_MAP_ID)).toBe('gate')
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

  it('Forest / Deep Forest local mapはPhase 4 / 5までcurrent runtimeを維持する', () => {
    expect(getTerrain(28, 10, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(24, 18, JS_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(30, 10, JS_FOREST_MAP_ID)).toBe('exit')
    expect(getTerrain(28, 10, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(getTerrain(10, 20, JS_DEEP_FOREST_MAP_ID)).toBe('road')
    expect(
      getTerrain(
        JS_DEEP_FOREST_CORE_EXIT_POSITION.x,
        JS_DEEP_FOREST_CORE_EXIT_POSITION.y,
        JS_DEEP_FOREST_MAP_ID,
      ),
    ).toBe('exit')
  })

  it('TypeScript Frontierはstone / crystal / ruins / gateでJS自然mapと別visual domainを持つ', () => {
    expect(getTerrain(2, 10, TS_FRONTIER_MAP_ID)).toBe('stone')
    expect(getTerrain(1, 10, TS_FRONTIER_MAP_ID)).toBe('gate')
    expect(['crystal', 'ruins']).toContain(getTerrain(6, 8, TS_FRONTIER_MAP_ID))
  })

  it('各地方のTreasureを直接踏めないWorld objectとして扱う', () => {
    expect(WORLD_TREASURES).toHaveLength(4)
    expect(WORLD_TREASURES.filter((treasure) => treasure.region === 'javascript')).toHaveLength(3)
    expect(WORLD_TREASURES.filter((treasure) => treasure.region === 'typescript')).toHaveLength(1)
    for (const treasure of WORLD_TREASURES) {
      expect(getTerrain(treasure.position.x, treasure.position.y, treasure.mapId)).toBe('treasure')
      expect(getTreasureAtPosition(treasure.position, treasure.mapId)?.id).toBe(treasure.id)
    }
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
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11], 0.9, JS_FOREST_MAP_ID)).toBe(11)
    expect(getEncounterBattleId('javascript', [10, 11, 12], [7, 8, 9, 1, 10, 11, 12], 0.9, JS_FOREST_MAP_ID)).toBe(12)
  })
})
