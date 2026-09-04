import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { resolveWorldMove } from './worldActions'
import { JS_FOREST_MAP_ID } from './worldMap'
import { PROGRESSION_LANDMARKS } from './progressionLandmarks'

function forestProgress(clearedStageIds: number[]) {
  const initial = createInitialPlayerProgress()
  return {
    ...initial,
    clearedStageIds,
    unlockedStageIds: [...initial.unlockedStageIds, 1, 8, 9, 10, 11, 12],
  }
}

function forestState(position: { x: number; y: number }) {
  return {
    ...createInitialRpgState(),
    worldMapId: JS_FOREST_MAP_ID,
    worldPosition: position,
    stepsSinceEncounter: 8,
    encounterCount: 0,
  }
}

function forestLandmark(battleId: 11 | 12) {
  const landmark = PROGRESSION_LANDMARKS.find(
    (candidate) => candidate.mapId === JS_FOREST_MAP_ID && candidate.battleId === battleId,
  )
  if (!landmark) throw new Error(`missing Forest landmark for Battle ${battleId}`)
  return landmark
}

const genericEncounterFrom = { x: 23, y: 10 }
const genericEncounterMove = { dx: 0, dy: -1 }

describe('JavaScript Forest learning route', () => {
  it('最初のincident後、Forestで最初にWoodsへ入るとBattle 10を固定導入する', () => {
    const result = resolveWorldMove({
      rpgState: forestState(genericEncounterFrom),
      progress: forestProgress([7, 8, 9, 1]),
      ...genericEncounterMove,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
    expect(result.nextState.worldPosition).toEqual({ x: 23, y: 9 })
  })

  it('Battle 10 clear後、Forest東側のRandom Encounterは10だけを反復する', () => {
    const result = resolveWorldMove({
      rpgState: forestState(genericEncounterFrom),
      progress: forestProgress([7, 8, 9, 1, 10]),
      ...genericEncounterMove,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(result.kind).toBe('encounter')
    if (result.kind !== 'encounter') return
    expect(result.battle.battleId).toBe(10)
  })

  it('Forest中盤の足跡landmarkへ進むとBattle 11を固定導入し、その後のRandomは10 / 11だけになる', () => {
    const landmark = forestLandmark(11)
    const lesson = resolveWorldMove({
      rpgState: forestState({ x: landmark.position.x + 1, y: landmark.position.y }),
      progress: forestProgress([7, 8, 9, 1, 10]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(11)
    expect(lesson.nextState.worldPosition).toEqual(landmark.position)

    const replay = resolveWorldMove({
      rpgState: forestState(genericEncounterFrom),
      progress: forestProgress([7, 8, 9, 1, 10, 11]),
      ...genericEncounterMove,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(11)
  })

  it('Forest西側の合流landmarkへ進むとBattle 12を固定導入し、clear後に10 / 11 / 12を反復する', () => {
    const landmark = forestLandmark(12)
    const lesson = resolveWorldMove({
      rpgState: forestState({ x: landmark.position.x + 1, y: landmark.position.y }),
      progress: forestProgress([7, 8, 9, 1, 10, 11]),
      dx: -1,
      dy: 0,
      encounterRolls: { trigger: 0.99, battle: 0.99 },
    })

    expect(lesson.kind).toBe('encounter')
    if (lesson.kind !== 'encounter') return
    expect(lesson.battle.battleId).toBe(12)
    expect(lesson.nextState.worldPosition).toEqual(landmark.position)

    const replay = resolveWorldMove({
      rpgState: forestState(genericEncounterFrom),
      progress: forestProgress([7, 8, 9, 1, 10, 11, 12]),
      ...genericEncounterMove,
      encounterRolls: { trigger: 0, battle: 0.99 },
    })

    expect(replay.kind).toBe('encounter')
    if (replay.kind !== 'encounter') return
    expect(replay.battle.battleId).toBe(12)
  })
})
