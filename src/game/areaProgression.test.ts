import { describe, expect, it } from 'vitest'
import { areaById, areas, JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from './areas'
import { getAreaForBattle, getBattlesForArea, getBossBattleForArea } from './areaProgression'
import { battles } from './battles'

describe('area progression lookup', () => {
  it('すべてのBattleが存在するAreaへ所属する', () => {
    for (const battle of battles) {
      expect(areaById[battle.areaId]).toBeDefined()
      expect(getAreaForBattle(battle.id)?.id).toBe(battle.areaId)
    }
  })

  it('各AreaのBattleを定義順どおり取得する', () => {
    expect(getBattlesForArea(JAVASCRIPT_AREA_ID).map((battle) => battle.id)).toEqual([
      1,
      2,
      3,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
    ])
    expect(getBattlesForArea(TYPESCRIPT_AREA_ID).map((battle) => battle.id)).toEqual([4, 5, 6])
  })

  it('AreaのBossは同じAreaに所属するBattleを参照する', () => {
    for (const area of areas) {
      if (!area.bossBattleId) {
        expect(getBossBattleForArea(area.id)).toBeUndefined()
        continue
      }

      const boss = getBossBattleForArea(area.id)
      expect(boss?.id).toBe(area.bossBattleId)
      expect(boss?.areaId).toBe(area.id)
      expect(boss?.isBoss).toBe(true)
    }
  })

  it('未知のBattle / Areaはundefinedまたは空配列になる', () => {
    expect(getAreaForBattle(999)).toBeUndefined()
    expect(getBossBattleForArea('unknown')).toBeUndefined()
    expect(getBattlesForArea('unknown')).toEqual([])
  })
})
