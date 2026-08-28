import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldInteraction, resolveWorldMove } from './worldActions'
import { JS_VILLAGE_MAP_ID, OVERWORLD_MAP_ID } from './worldMap'

describe('World action resolver', () => {
  it('blocked terrainではpositionとencounter stateを変えない', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 1, y: 1 },
      stepsSinceEncounter: 3,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: -1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
    expect(result.nextState).toBe(state)
    expect(result.nextState.worldPosition).toEqual({ x: 1, y: 1 })
    expect(result.nextState.stepsSinceEncounter).toBe(3)
  })

  it('Boss tileへ直接moveせず隣からinteractionする', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 8, y: 4 },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: -1,
    })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('boss')
    expect(result.nextState.worldPosition).toEqual({ x: 8, y: 4 })
  })

  it('Recovery Point tileへ直接moveせず隣からinteractionする', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 20, y: 16 },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('recovery')
    expect(result.nextState.worldPosition).toEqual({ x: 20, y: 16 })
  })

  it('Treasure tileへ直接moveせず隣からinteractionする', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 10, y: 18 },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: 1,
    })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('treasure')
    expect(result.nextState.worldPosition).toEqual({ x: 10, y: 18 })
  })

  it('通常moveでpositionとstepsSinceEncounterを更新する', () => {
    const state = createInitialRpgState()
    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 1,
      dy: 0,
    })

    expect(result.kind).toBe('moved')
    expect(result.nextState.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(result.nextState.worldPosition).toEqual({ x: 21, y: 14 })
    expect(result.nextState.stepsSinceEncounter).toBe(state.stepsSinceEncounter + 1)
    expect(result.nextState.encounterCount).toBe(state.encounterCount)
  })

  it('OverworldのVillage入口へ入るとVillage mapへtransitionする', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 14, y: 13 },
      stepsSinceEncounter: 8,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: -1,
    })

    expect(result.kind).toBe('transition')
    if (result.kind !== 'transition') return
    expect(result.terrain).toBe('village')
    expect(result.fromMapId).toBe(OVERWORLD_MAP_ID)
    expect(result.toMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(result.nextState.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(result.nextState.worldPosition).toEqual({ x: 10, y: 12 })
    expect(result.nextState.stepsSinceEncounter).toBe(9)
  })

  it('Village南口へ進むとOverworldへtransitionして入口前へ戻る', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 10, y: 13 },
      stepsSinceEncounter: 9,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: 1,
    })

    expect(result.kind).toBe('transition')
    if (result.kind !== 'transition') return
    expect(result.terrain).toBe('exit')
    expect(result.fromMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(result.toMapId).toBe(OVERWORLD_MAP_ID)
    expect(result.nextState.worldMapId).toBe(OVERWORLD_MAP_ID)
    expect(result.nextState.worldPosition).toEqual({ x: 14, y: 13 })
  })

  it('Village内はrollを強制してもRandom Encounterを開始しない', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 10, y: 12 },
      stepsSinceEncounter: 20,
      encounterCount: 7,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('moved')
    expect(result.nextState.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(result.nextState.worldPosition).toEqual({ x: 10, y: 11 })
    expect(result.nextState.encounterCount).toBe(7)
  })

  it('cooldown中はEncounter terrainでも戦闘を開始しない', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 10, y: 10 },
      stepsSinceEncounter: 3,
      encounterCount: 7,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: 1,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('moved')
    expect(result.terrain).toBe('tall-grass')
    expect(result.nextState.stepsSinceEncounter).toBe(4)
    expect(result.nextState.encounterCount).toBe(7)
  })

  it('cooldown後の草むらでrollが当たるとJS Encounter intentを返す', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 10, y: 10 },
      stepsSinceEncounter: 4,
      encounterCount: 0,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 0,
      dy: 1,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return

    expect(result.nextState.worldPosition).toEqual({ x: 10, y: 11 })
    expect(result.nextState.stepsSinceEncounter).toBe(0)
    expect(result.nextState.encounterCount).toBe(1)
    expect(result.battle).toEqual({
      battleId: 1,
      region: 'javascript',
      seed: 'encounter:1:10:11',
    })
  })

  it('BYTE / Shop / Recovery / Treasure / Boss interactionをintentとして返す', () => {
    const initialProgress = createInitialPlayerProgress()
    const initialState = createInitialRpgState()

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 20, y: 13 } },
        initialProgress,
      ),
    ).toEqual({ kind: 'party', memberId: 'byte', alreadyJoined: false })

    expect(
      resolveWorldInteraction(
        {
          ...initialState,
          worldPosition: { x: 20, y: 13 },
          partyMemberIds: ['byte'],
        },
        initialProgress,
      ),
    ).toEqual({ kind: 'party', memberId: 'byte', alreadyJoined: true })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 21, y: 12 } },
        initialProgress,
      ),
    ).toEqual({ kind: 'shop' })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 20, y: 16 }, currentHp: 31 },
        initialProgress,
      ),
    ).toEqual({ kind: 'recovery' })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 10, y: 18 } },
        initialProgress,
      ),
    ).toEqual({ kind: 'treasure', treasureId: 'js-debug-cache', opened: false })

    expect(
      resolveWorldInteraction(
        {
          ...initialState,
          worldPosition: { x: 10, y: 18 },
          openedTreasureIds: ['js-debug-cache'],
        },
        initialProgress,
      ),
    ).toEqual({ kind: 'treasure', treasureId: 'js-debug-cache', opened: true })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 30, y: 18 } },
        initialProgress,
      ),
    ).toEqual({ kind: 'treasure', treasureId: 'ts-supply-cache', opened: false })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 8, y: 4 }, encounterCount: 3 },
        initialProgress,
      ),
    ).toEqual({
      kind: 'boss',
      battleId: 3,
      region: 'javascript',
      unlocked: false,
      seed: 'boss:js:3',
    })

    expect(
      resolveWorldInteraction(
        { ...initialState, worldPosition: { x: 8, y: 4 }, encounterCount: 3 },
        { ...initialProgress, unlockedStageIds: [...initialProgress.unlockedStageIds, 3] },
      ),
    ).toEqual({
      kind: 'boss',
      battleId: 3,
      region: 'javascript',
      unlocked: true,
      seed: 'boss:js:3',
    })
  })

  it('VillageではOverworldと同じ座標でもfixed object interactionが発火しない', () => {
    const initialState = createInitialRpgState()
    const initialProgress = createInitialPlayerProgress()

    expect(
      resolveWorldInteraction(
        {
          ...initialState,
          worldMapId: JS_VILLAGE_MAP_ID,
          worldPosition: { x: 19, y: 13 },
        },
        initialProgress,
      ),
    ).toEqual({ kind: 'none' })
  })

  it('周囲にobjectがない場合はnoneを返す', () => {
    expect(
      resolveWorldInteraction(createInitialRpgState(), createInitialPlayerProgress()),
    ).toEqual({ kind: 'none' })
  })
})
