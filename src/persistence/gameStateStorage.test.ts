import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress, serializePlayerProgress } from '../progression'
import { createInitialRpgState, serializeRpgState } from '../rpg'
import {
  rollbackBattleSession,
  startBattleSession,
  updateBattleSession,
} from '../battle/sessionTransaction'
import {
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_MAP_STARTS,
} from '../world/worldMap'
import {
  GAME_STATE_BACKUP_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  normalizeRpgStateForProgress,
  parseGameStateSnapshot,
  readGameStateFromStorage,
  resolveGameStateWrite,
  restoreGameState,
  serializeGameStateSnapshot,
  writeGameStateToStorage,
} from './gameStateStorage'

describe('logical game-state storage', () => {
  it('ProgressとRpgStateを同じrevision snapshotへ保存する', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 40 }
    const rpgState = { ...createInitialRpgState(), partyMemberIds: ['byte'] }
    const raw = serializeGameStateSnapshot({ revision: 12, progress, rpgState })

    expect(parseGameStateSnapshot(raw)).toEqual({ revision: 12, progress, rpgState })
    expect(JSON.parse(raw)).toMatchObject({
      version: 2,
      revision: 12,
      progress: { version: 4 },
      rpg: { version: 5 },
    })
  })

  it('root v1 migrates without inventing a battle session or losing state', () => {
    const previous = {
      revision: 19,
      progress: createInitialPlayerProgress(),
      rpgState: createInitialRpgState(),
    }
    const legacy = JSON.parse(serializeGameStateSnapshot(previous))
    legacy.version = 1
    delete legacy.battleSession
    const migrated = parseGameStateSnapshot(JSON.stringify(legacy))
    expect(migrated).toEqual(previous)
    expect(JSON.parse(serializeGameStateSnapshot(migrated!))).toMatchObject({
      version: 2,
      battleSession: null,
    })
  })

  it('unfinished session persists its start snapshot and reload rolls back HP and inventory together', () => {
    const before = {
      revision: 9,
      progress: { ...createInitialPlayerProgress(), inventory: { patchKit: 2 } },
      rpgState: { ...createInitialRpgState(), currentHp: 40 },
    }
    const identity = { id: 'attempt', areaId: 'javascript', battleId: 7, seed: 'fixed' }
    const started = startBattleSession(before, identity)
    const changed = updateBattleSession(started, identity.id, (current) => ({
      ...current,
      progress: { ...current.progress, inventory: { patchKit: 1 } },
      rpgState: { ...current.rpgState, currentHp: 64 },
    }))
    const restored = parseGameStateSnapshot(serializeGameStateSnapshot(changed))!
    expect(restored.battleSession).toMatchObject({
      identity,
      progress: { inventory: { patchKit: 2 } },
      rpgState: { currentHp: 40 },
    })
    expect(rollbackBattleSession(restored)).toEqual({ ...before, battleSession: undefined })
  })

  it.each(['identity', 'progress', 'rpg'])(
    'corrupt session %s rejects the whole root and recovers backup',
    (part) => {
      const before = {
        revision: 4,
        progress: createInitialPlayerProgress(),
        rpgState: createInitialRpgState(),
      }
      const backupRaw = serializeGameStateSnapshot(before)
      const identity = { id: 'attempt', areaId: 'javascript', battleId: 7, seed: 'fixed' }
      const broken = JSON.parse(
        serializeGameStateSnapshot(startBattleSession({ ...before, revision: 5 }, identity)),
      )
      broken.battleSession[part] = {}
      expect(parseGameStateSnapshot(JSON.stringify(broken))).toBeNull()
      expect(
        restoreGameState({
          currentRaw: JSON.stringify(broken),
          backupRaw,
          legacyProgressRaw: null,
          legacyRpgRaw: null,
        }),
      ).toEqual(before)
    },
  )

  it('root snapshotが壊れていれば直前のvalid backupへrecoverする', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 75 }
    const rpgState = { ...createInitialRpgState(), currentHp: 61 }
    const backupRaw = serializeGameStateSnapshot({ revision: 8, progress, rpgState })

    expect(
      restoreGameState({
        currentRaw: '{broken',
        backupRaw,
        legacyProgressRaw: null,
        legacyRpgRaw: null,
      }),
    ).toEqual({ revision: 8, progress, rpgState })
  })

  it.each(['progress', 'rpg'] as const)(
    'rootの%s片側だけが壊れた場合もbackup transaction全体を復元する',
    (part) => {
      const previous = {
        revision: 6,
        progress: { ...createInitialPlayerProgress(), gold: 55 },
        rpgState: { ...createInitialRpgState(), currentHp: 42 },
      }
      const backupRaw = serializeGameStateSnapshot(previous)
      const current = JSON.parse(serializeGameStateSnapshot({ ...previous, revision: 7 }))
      current[part] = part === 'rpg' ? { version: 5, state: {} } : { version: 4, progress: {} }
      expect(parseGameStateSnapshot(JSON.stringify(current))).toBeNull()
      expect(
        restoreGameState({
          currentRaw: JSON.stringify(current),
          backupRaw,
          legacyProgressRaw: null,
          legacyRpgRaw: null,
        }),
      ).toEqual(previous)
    },
  )

  it('旧split saveの片側だけが存在してもvalid側を維持して初期値と統合する', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 55 }
    const progressOnly = restoreGameState({
      currentRaw: null,
      backupRaw: null,
      legacyProgressRaw: serializePlayerProgress(progress),
      legacyRpgRaw: null,
    })
    expect(progressOnly.progress.gold).toBe(55)
    expect(progressOnly.rpgState).toEqual(createInitialRpgState())

    const rpgState = { ...createInitialRpgState(), currentHp: 37, partyMemberIds: ['byte'] }
    const rpgOnly = restoreGameState({
      currentRaw: null,
      backupRaw: null,
      legacyProgressRaw: null,
      legacyRpgRaw: serializeRpgState(rpgState),
    })
    expect(rpgOnly.progress).toEqual(createInitialPlayerProgress())
    expect(rpgOnly.rpgState.currentHp).toBe(37)
    expect(rpgOnly.rpgState.partyMemberIds).toEqual(['byte'])
  })

  it('locked TypeScript map位置はProgressと同時restoreしてOverworld開始位置へ戻す', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 8, y: 8 },
    }
    const restored = parseGameStateSnapshot(
      serializeGameStateSnapshot({ revision: 2, progress, rpgState }),
    )

    expect(restored?.rpgState.worldMapId).toBe('overworld')
    expect(restored?.rpgState.worldPosition).toEqual(WORLD_MAP_STARTS.overworld)
  })

  it('unlock済みならTypeScript map位置を保持する', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: [3] }
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 8, y: 8 },
    }
    const restored = parseGameStateSnapshot(
      serializeGameStateSnapshot({ revision: 2, progress, rpgState }),
    )

    expect(restored?.rpgState.worldMapId).toBe(TS_FRONTIER_MAP_ID)
    expect(restored?.rpgState.worldPosition).toEqual({ x: 8, y: 8 })
  })

  it.each([JS_FOREST_MAP_ID, JS_DEEP_FOREST_MAP_ID])(
    'portal graphでlockedな%sも正規化する',
    (worldMapId) => {
      const progress = createInitialPlayerProgress()
      const rpgState = { ...createInitialRpgState(), worldMapId, worldPosition: { x: 8, y: 8 } }
      const restored = parseGameStateSnapshot(
        serializeGameStateSnapshot({ revision: 2, progress, rpgState }),
      )
      expect(restored?.rpgState.worldMapId).toBe('overworld')
    },
  )

  it('in-memory partial clear bits cannot preserve a position behind a transitive portal gate', () => {
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 8, y: 8 },
    }
    const partial = { ...createInitialPlayerProgress(), clearedStageIds: [1, 9] }
    expect(normalizeRpgStateForProgress(partial, rpgState)).toMatchObject({
      worldMapId: 'overworld',
      worldPosition: WORLD_MAP_STARTS.overworld,
    })
    const complete = { ...partial, clearedStageIds: [1, 7, 8, 9] }
    expect(normalizeRpgStateForProgress(complete, rpgState)).toBe(rpgState)
  })

  it('backup書き込み後にroot commitが失敗しても旧transactionをまるごと復元する', () => {
    const before = {
      revision: 3,
      progress: { ...createInitialPlayerProgress(), gold: 100 },
      rpgState: createInitialRpgState(),
    }
    const values = new Map([[GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(before)]])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => {
        values.delete(key)
      },
      setItem: (key: string, value: string) => {
        if (key === GAME_STATE_STORAGE_KEY) throw new Error('simulated interrupted commit')
        values.set(key, value)
      },
    }
    const after = {
      ...before,
      progress: { ...before.progress, gold: 60 },
      rpgState: { ...before.rpgState, currentHp: 50 },
    }

    expect(() => writeGameStateToStorage(storage, after)).toThrow('simulated interrupted commit')
    expect(values.has(GAME_STATE_BACKUP_STORAGE_KEY)).toBe(true)
    expect(readGameStateFromStorage(storage)).toEqual(before)
  })

  it('rootがcommit済みならlegacy cleanup失敗で新transactionを失わない', () => {
    const snapshot = {
      revision: 0,
      progress: { ...createInitialPlayerProgress(), gold: 60 },
      rpgState: { ...createInitialRpgState(), currentHp: 50 },
    }
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
      removeItem: () => {
        throw new Error('cleanup unavailable')
      },
    }

    expect(writeGameStateToStorage(storage, snapshot).kind).toBe('commit')
    expect(readGameStateFromStorage(storage)).toEqual({ ...snapshot, revision: 1 })
  })

  it('newer revisionを検出したstale tabは上書きせずremote snapshotを採用する', () => {
    const local = {
      revision: 3,
      progress: { ...createInitialPlayerProgress(), gold: 10 },
      rpgState: createInitialRpgState(),
    }
    const remote = {
      revision: 4,
      progress: { ...createInitialPlayerProgress(), gold: 90 },
      rpgState: { ...createInitialRpgState(), currentHp: 44 },
    }

    expect(resolveGameStateWrite(local, remote)).toEqual({
      kind: 'adopt',
      snapshot: remote,
    })
    expect(resolveGameStateWrite(remote, remote)).toMatchObject({
      kind: 'commit',
      snapshot: { revision: 5 },
    })
  })

  it('rootとbackupが別tabでresetされたら旧進行を復活させない', () => {
    const stale = {
      revision: 9,
      progress: { ...createInitialPlayerProgress(), gold: 999 },
      rpgState: createInitialRpgState(),
    }
    const writes: string[] = []
    const decision = writeGameStateToStorage(
      {
        getItem: () => null,
        setItem: (key) => {
          writes.push(key)
        },
        removeItem: () => undefined,
      },
      stale,
    )

    expect(decision.kind).toBe('adopt')
    expect(decision.snapshot.progress.gold).toBe(0)
    expect(writes).toEqual([])
  })
})
