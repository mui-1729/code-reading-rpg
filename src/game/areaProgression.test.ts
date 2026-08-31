import { describe, expect, it } from 'vitest'
import { getBattleDisplayCode } from '../progression/progressionGraph'
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

  it('各AreaのBattleをsemantic Story順で取得する', () => {
    expect(getBattlesForArea(JAVASCRIPT_AREA_ID).map((battle) => battle.id)).toEqual([
      1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3,
    ])
    expect(getBattlesForArea(TYPESCRIPT_AREA_ID).map((battle) => battle.id)).toEqual([4, 5, 6])
  })

  it('player-facing Battle labelはsemantic順のArea番号と一致する', () => {
    for (const areaId of [JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID]) {
      for (const battle of getBattlesForArea(areaId)) {
        expect(battle.label.startsWith(getBattleDisplayCode(battle.id) ?? 'missing')).toBe(true)
      }
    }
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
