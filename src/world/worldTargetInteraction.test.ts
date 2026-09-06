import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { VILLAGE_FACILITIES } from './villageFacilityData'
import {
  BYTE_POSITION,
  JS_VILLAGE_MAP_ID,
  JS_VILLAGE_TRAINING_POSITION,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_PORTALS,
} from './worldMap'
import {
  TS_FRONTIER_OUTPOST_INN_POSITION,
  TS_FRONTIER_OUTPOST_SHOP_POSITION,
} from './typescriptFrontierOutpost'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'

describe('facing-based world interaction', () => {
  it('does not select another adjacent object when the faced target is empty', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: OVERWORLD_MAP_ID,
      worldPosition: { x: BYTE_POSITION.x - 1, y: BYTE_POSITION.y - 1 },
    }

    expect(
      resolveWorldTargetInteraction(rpgState, progress, {
        x: rpgState.worldPosition.x,
        y: rpgState.worldPosition.y - 1,
      }),
    ).toEqual({ kind: 'none' })
    expect(resolveWorldTargetInteraction(rpgState, progress, BYTE_POSITION)).toMatchObject({
      kind: 'party',
      memberId: 'byte',
    })
  })

  it('resolves GREENFIELD facilities only from their exact target tile', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: 6, y: 11 },
    }
    const inn = VILLAGE_FACILITIES.find((facility) => facility.kind === 'inn')!

    expect(resolveWorldTargetInteraction(rpgState, progress, inn.position)).toEqual({
      kind: 'village-facility',
      facility: 'inn',
    })
    expect(resolveWorldTargetInteraction(rpgState, progress, { x: 6, y: 10 })).toEqual({
      kind: 'none',
    })
  })

  it('resolves TypeScript frontier outpost shop and inn from their exact residents', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: [3] }
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: TS_FRONTIER_MAP_ID,
      worldPosition: { x: 7, y: 10 },
    }

    expect(resolveWorldTargetInteraction(rpgState, progress, TS_FRONTIER_OUTPOST_SHOP_POSITION)).toEqual({
      kind: 'shop',
    })
    expect(resolveWorldTargetInteraction(rpgState, progress, TS_FRONTIER_OUTPOST_INN_POSITION)).toEqual({
      kind: 'recovery',
    })
  })

  it('registers GREENFIELD as the safe checkpoint when its portal is entered', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: [1] }
    const rpgState = createInitialRpgState()
    const portal = WORLD_PORTALS.find(
      (candidate) =>
        candidate.fromMapId === OVERWORLD_MAP_ID && candidate.toMapId === JS_VILLAGE_MAP_ID,
    )!

    const intent = resolveWorldTargetInteraction(rpgState, progress, portal.position)
    expect(intent.kind).toBe('map-transition')
    if (intent.kind !== 'map-transition') throw new Error('expected GREENFIELD map transition')

    expect(intent.nextState.worldMapId).toBe(JS_VILLAGE_MAP_ID)
    expect(intent.nextState.safeCheckpoint).toMatchObject({
      id: 'greenfield-village',
      mapId: JS_VILLAGE_MAP_ID,
    })
  })

  it('resolves MIO training from the faced training tile', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: [1] }
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: JS_VILLAGE_TRAINING_POSITION.x, y: JS_VILLAGE_TRAINING_POSITION.y + 1 },
    }

    expect(
      resolveWorldTargetInteraction(rpgState, progress, JS_VILLAGE_TRAINING_POSITION),
    ).toMatchObject({ kind: 'training', battleId: 7 })
  })

  it('resolves MIO as an NPC after all training battles are complete', () => {
    const progress = { ...createInitialPlayerProgress(), clearedStageIds: [1, 7, 8, 9] }
    const rpgState = {
      ...createInitialRpgState(),
      worldMapId: JS_VILLAGE_MAP_ID,
      worldPosition: { x: JS_VILLAGE_TRAINING_POSITION.x, y: JS_VILLAGE_TRAINING_POSITION.y + 1 },
    }

    expect(
      resolveWorldTargetInteraction(rpgState, progress, JS_VILLAGE_TRAINING_POSITION),
    ).toMatchObject({ kind: 'npc', placement: { npcId: 'trainer-mio' } })
  })
})
