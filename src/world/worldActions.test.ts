import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import {
  getNextJavaScriptTrainingBattleId,
  resolveWorldInteraction,
  resolveWorldMove,
} from './worldActions'
import {
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
} from './worldMap'

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

  it('最初のincident前はVillage入口を通れない', () => {
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

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('village')
    expect(result.nextState).toBe(state)
    expect(resolveWorldInteraction(state, createInitialPlayerProgress())).toEqual({ kind: 'none' })
  })

  it('最初のincident clear後はVillage入口で止まりinteractionでVillage mapへ入る', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 14, y: 13 },
      stepsSinceEncounter: 8,
    }
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 7],
    }

    const moveResult = resolveWorldMove({ rpgState: state, progress, dx: 0, dy: -1 })
    expect(moveResult.kind).toBe('blocked')
    expect(moveResult.terrain).toBe('village')
    expect(moveResult.nextState).toBe(state)

    const intent = resolveWorldInteraction(state, progress)
    expect(intent.kind).toBe('map-transition')
    if (intent.kind !== 'map-transition') return
    expect(intent.toMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(intent.label).toBe('グリーンフィールド村')
    expect(intent.nextState.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(intent.nextState.worldPosition).toEqual({ x: 10, y: 12 })
    expect(intent.nextState.stepsSinceEncounter).toBe(9)
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

  it('最初のincidentだけclearしてもTraining 9未clearならForest入口を通れない', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 8, y: 14 },
      stepsSinceEncounter: 8,
    }
    const progress = {
      ...createInitialPlayerProgress(),
      clearedStageIds: [1],
      unlockedStageIds: [1, 7],
    }

    const result = resolveWorldMove({ rpgState: state, progress, dx: -1, dy: 0 })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('woods')
    expect(result.nextState).toBe(state)
  })

  it('incident観察とTraining完了後はOverworldからForestへ入り、東口から戻れる', () => {
    const initialProgress = createInitialPlayerProgress()
    const progress = {
      ...initialProgress,
      clearedStageIds: [1, 7, 8, 9],
      unlockedStageIds: [1, 7, 8, 9, 10],
    }
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 8, y: 14 },
      stepsSinceEncounter: 8,
    }

    const enter = resolveWorldMove({ rpgState: state, progress, dx: -1, dy: 0 })
    expect(enter.kind).toBe('transition')
    if (enter.kind !== 'transition') return
    expect(enter.toMapId).toBe(JS_FOREST_MAP_ID)
    expect(enter.nextState.worldPosition).toEqual({ x: 28, y: 10 })

    const exit = resolveWorldMove({
      rpgState: {
        ...enter.nextState,
        worldPosition: { x: 29, y: 10 },
      },
      progress,
      dx: 1,
      dy: 0,
    })
    expect(exit.kind).toBe('transition')
    if (exit.kind !== 'transition') return
    expect(exit.toMapId).toBe(OVERWORLD_MAP_ID)
    expect(exit.nextState.worldPosition).toEqual({ x: 8, y: 14 })
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

  it('ForestではTraining完了後の最初のEncounterとしてBattle 10を返す', () => {
    const initialProgress = createInitialPlayerProgress()
    const progress = {
      ...initialProgress,
      clearedStageIds: [1, 7, 8, 9],
      unlockedStageIds: [1, 7, 8, 9, 10],
    }
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_FOREST_MAP_ID,
      worldPosition: { x: 25, y: 10 },
      stepsSinceEncounter: 4,
      encounterCount: 2,
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress,
      dx: 0,
      dy: -1,
      encounterRolls: { trigger: 0, battle: 0.9 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.terrain).toBe('woods')
    expect(result.nextState.worldMapId).toBe(JS_FOREST_MAP_ID)
    expect(result.battle).toEqual({
      battleId: 10,
      region: 'javascript',
      seed: 'encounter:js-forest:3:25:9',
    })
  })

  it('Village TRAIN tileへ直接moveせず隣からinteractionする', () => {
    const state = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: JS_VILLAGE_TRAINING_POSITION.x - 1, y: JS_VILLAGE_TRAINING_POSITION.y },
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress: createInitialPlayerProgress(),
      dx: 1,
      dy: 0,
    })

    expect(result.kind).toBe('blocked')
    expect(result.terrain).toBe('training')
    expect(result.nextState.worldPosition).toEqual({ x: 11, y: 7 })
  })

  it('Trainingはfirst incident後だけ7→8→9の順で次の未clear Battleを返す', () => {
    expect(getNextJavaScriptTrainingBattleId([])).toBeNull()
    expect(getNextJavaScriptTrainingBattleId([1])).toBe(7)
    expect(getNextJavaScriptTrainingBattleId([1, 7])).toBe(8)
    expect(getNextJavaScriptTrainingBattleId([1, 7, 8])).toBe(9)
    expect(getNextJavaScriptTrainingBattleId([1, 7, 8, 9])).toBeNull()
  })

  it('Village TRAIN interactionはincident clear後の状況に応じてBattle 7→8→9を返す', () => {
    const initialState = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 11, y: 7 },
    }
    const initialProgress = createInitialPlayerProgress()

    expect(resolveWorldInteraction(initialState, initialProgress)).toEqual({
      kind: 'training',
      battleId: null,
    })
    expect(
      resolveWorldInteraction(initialState, {
        ...initialProgress,
        clearedStageIds: [1],
      }),
    ).toEqual({ kind: 'training', battleId: 7 })
    expect(
      resolveWorldInteraction(initialState, {
        ...initialProgress,
        clearedStageIds: [1, 7],
      }),
    ).toEqual({ kind: 'training', battleId: 8 })
    expect(
      resolveWorldInteraction(initialState, {
        ...initialProgress,
        clearedStageIds: [1, 7, 8],
      }),
    ).toEqual({ kind: 'training', battleId: 9 })
    expect(
      resolveWorldInteraction(initialState, {
        ...initialProgress,
        clearedStageIds: [1, 7, 8, 9],
      }),
    ).toEqual({ kind: 'training', battleId: null })
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

  it('Battle 22後はOverworldでRandom EncounterせずCode Coreへ向かえる', () => {
    const state = {
      ...createInitialRpgState(),
      worldPosition: { x: 10, y: 10 },
      stepsSinceEncounter: 4,
      encounterCount: 0,
    }
    const initialProgress = createInitialPlayerProgress()
    const progress = {
      ...initialProgress,
      clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22],
    }

    const result = resolveWorldMove({
      rpgState: state,
      progress,
      dx: 0,
      dy: 1,
      encounterRolls: { trigger: 0, battle: 0 },
    })

    expect(result.kind).toBe('moved')
    if (result.kind !== 'moved') return
    expect(result.nextState.worldPosition).toEqual({ x: 10, y: 11 })
    expect(result.nextState.stepsSinceEncounter).toBe(5)
    expect(result.nextState.encounterCount).toBe(0)
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
        {
          ...initialProgress,
          clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22],
        },
      ),
    ).toEqual({
      kind: 'boss',
      battleId: 3,
      region: 'javascript',
      unlocked: true,
      seed: 'boss:js:3',
    })
  })

  it('Village / ForestではOverworldと同じ座標でもfixed object interactionが発火しない', () => {
    const initialState = createInitialRpgState()
    const initialProgress = createInitialPlayerProgress()

    for (const worldMapId of [JS_VILLAGE_MAP_ID, JS_FOREST_MAP_ID] as const) {
      expect(
        resolveWorldInteraction(
          {
            ...initialState,
            worldMapId,
            worldPosition: { x: 19, y: 13 },
          },
          initialProgress,
        ),
      ).toEqual({ kind: 'none' })
    }
  })

  it('周囲にobjectがない場合はnoneを返す', () => {
    expect(
      resolveWorldInteraction(createInitialRpgState(), createInitialPlayerProgress()),
    ).toEqual({ kind: 'none' })
  })
})