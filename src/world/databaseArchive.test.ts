import { describe, expect, it } from 'vitest'
import {
  createInitialPlayerProgress,
  getCanonicalUnlockedStageIds,
  JAVASCRIPT_BATTLE_SEQUENCE,
  TYPESCRIPT_BATTLE_SEQUENCE,
  applyBattleVictory,
} from '../progression'
import { createInitialRpgState } from '../rpg'
import { serializeGameStateSnapshot, parseGameStateSnapshot } from '../persistence/gameStateStorage'
import {
  getWorldPortalAtPosition,
  getWorldMapDimensions,
  getTerrain,
  isWalkableTerrain,
  isEncounterTerrain,
  TS_FRONTIER_MAP_ID,
} from './worldMap'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'
import {
  DATABASE_ARCHIVE_MAP_ID,
  DATABASE_ARCHIVE_LECTERN,
  DATABASE_ARCHIVE_START,
  DATABASE_FRONTIER_GATE,
} from './databaseArchive'
import { isBattleRouteUnlocked } from '../game/battleRouteAccess'
import { getAreaClearIdForBattle } from '../game/areaProgression'
import { battles } from '../game/battles'
import { isBattleEscapeAllowed } from '../game/battleEscape'

const complete = [...JAVASCRIPT_BATTLE_SEQUENCE, ...TYPESCRIPT_BATTLE_SEQUENCE]
const progress = (clearedStageIds: number[]) => ({
  ...createInitialPlayerProgress(),
  clearedStageIds,
  unlockedStageIds: getCanonicalUnlockedStageIds(clearedStageIds),
})

describe('Database Archive integration', () => {
  it('JS・TS finalの完全なprerequisite chainが揃うまでportalとdirect Battleを閉じる', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 27, y: 15 },
    }
    for (const cleared of [
      [],
      [3],
      [6],
      [3, 6],
      [23],
      complete.filter((id) => id !== 3),
      complete.filter((id) => id !== 6),
    ]) {
      expect(
        resolveWorldTargetInteraction(state, progress(cleared), DATABASE_FRONTIER_GATE).kind,
      ).toBe('locked-portal')
      expect(isBattleRouteUnlocked('database', 23, progress(cleared))).toBe(false)
    }
    expect(
      resolveWorldTargetInteraction(state, progress(complete), DATABASE_FRONTIER_GATE),
    ).toMatchObject({ kind: 'map-transition', toMapId: DATABASE_ARCHIVE_MAP_ID })
    expect(isBattleRouteUnlocked('database', 23, progress(complete))).toBe(true)
  })

  it('小さい書庫で全通路が安全、入口から閲覧台まで到達できる', () => {
    expect(getWorldMapDimensions(DATABASE_ARCHIVE_MAP_ID)).toEqual({ width: 19, height: 15 })
    const queue = [DATABASE_ARCHIVE_START]
    const visited = new Set([`${queue[0].x}:${queue[0].y}`])
    for (let index = 0; index < queue.length; index += 1) {
      const point = queue[index]
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const next = { x: point.x + dx, y: point.y + dy }
        const key = `${next.x}:${next.y}`
        const terrain = getTerrain(next.x, next.y, DATABASE_ARCHIVE_MAP_ID)
        expect(isEncounterTerrain(terrain)).toBe(false)
        if (
          !isWalkableTerrain(terrain) ||
          visited.has(key) ||
          getWorldPortalAtPosition(DATABASE_ARCHIVE_MAP_ID, next)
        )
          continue
        visited.add(key)
        queue.push(next)
      }
    }
    expect(visited.has(`${DATABASE_ARCHIVE_LECTERN.x}:${DATABASE_ARCHIVE_LECTERN.y + 1}`)).toBe(
      true,
    )
  })

  it('既存save形式で地下書庫の位置・HP・Gold・clearを保持し、未開通saveはnormalizeする', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: DATABASE_ARCHIVE_MAP_ID,
      worldPosition: { x: 15, y: 5 },
      currentHp: 57,
    }
    for (const cleared of [complete, [], [3, 6]]) {
      const restored = parseGameStateSnapshot(
        serializeGameStateSnapshot({ revision: 7, progress: progress(cleared), rpgState: state }),
      )!
      expect(restored.rpgState.worldMapId).toBe(
        cleared === complete ? DATABASE_ARCHIVE_MAP_ID : 'overworld',
      )
      expect(restored.rpgState.currentHp).toBe(57)
    }
    const battle = battles.find((battle) => battle.id === 23)!
    const first = applyBattleVictory(progress(complete), {
      stageId: battle.id,
      expReward: battle.expReward,
      goldReward: battle.goldReward,
      clearAreaId: getAreaClearIdForBattle(battle),
    }).progress
    expect(first.clearedStageIds).toContain(23)
    expect(first.clearedAreaIds).toContain('database')
    expect(first.gold).toBeGreaterThan(0)
    const restored = parseGameStateSnapshot(
      serializeGameStateSnapshot({ revision: 8, progress: first, rpgState: state }),
    )!
    expect(restored.progress).toEqual(first)
    expect(restored.rpgState.worldPosition).toEqual(state.worldPosition)
  })

  it('最初のLessonは逃走不可、既習queryの再調査だけescapeできる', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: DATABASE_ARCHIVE_MAP_ID,
      worldPosition: { x: 15, y: 5 },
    }
    for (const cleared of [complete, [...complete, 23]]) {
      const intent = resolveWorldTargetInteraction(
        state,
        progress(cleared),
        DATABASE_ARCHIVE_LECTERN,
      )
      if (intent.kind !== 'archive-trial') throw new Error('Archive interaction missing')
      expect(
        isBattleEscapeAllowed({
          battleId: 23,
          seed: intent.seed,
          returnTo: '/world',
          clearedStageIds: cleared,
        }),
      ).toBe(cleared.includes(23))
    }
  })
})
