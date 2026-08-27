import { describe, expect, it } from 'vitest'
import {
  getEncounterBattleId,
  getTerrain,
  getTreasureAtPosition,
  getVisibleWorldCells,
  getWorldRegion,
  isEncounterTerrain,
  isWalkableTerrain,
  JS_BOSS_POSITION,
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

  it('左をJavaScript草原、中央をHub、右をTypeScript森として扱う', () => {
    expect(getWorldRegion(8)).toBe('javascript')
    expect(getWorldRegion(20)).toBe('hub')
    expect(getWorldRegion(32)).toBe('typescript')
  })

  it('Bossは固定地点で、草むらと森だけがRandom Encounter対象になる', () => {
    expect(getTerrain(JS_BOSS_POSITION.x, JS_BOSS_POSITION.y)).toBe('boss')
    expect(getTerrain(TS_BOSS_POSITION.x, TS_BOSS_POSITION.y)).toBe('boss')
    expect(isWalkableTerrain('boss')).toBe(false)
    expect(isEncounterTerrain('tall-grass')).toBe(true)
    expect(isEncounterTerrain('forest')).toBe(true)
    expect(isEncounterTerrain('road')).toBe(false)
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
