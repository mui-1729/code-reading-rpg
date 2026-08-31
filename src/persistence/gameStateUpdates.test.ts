import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression/progression'
import { createInitialRpgState } from '../rpg/state'
import { updateGameProgress, updateGameRpgState } from './gameStateUpdates'

describe('shared state updates', () => {
  it('same-reference updaterはdirty revisionを作らず別tabの既存reward effectでping-pongしない', () => {
    const current = {
      revision: 8,
      progress: { ...createInitialPlayerProgress(), clearedAreaIds: ['javascript'] },
      rpgState: {
        ...createInitialRpgState(),
        ownedEquipmentIds: ['training-blade', 'traveler-coat', 'branch-saber'],
      },
      dirty: false,
    }

    expect(updateGameProgress(current, (progress) => progress)).toBe(current)
    expect(updateGameProgress(current, current.progress)).toBe(current)
    expect(updateGameRpgState(current, (rpgState) => {
      if (rpgState.ownedEquipmentIds.includes('branch-saber')) return rpgState
      return { ...rpgState, ownedEquipmentIds: [...rpgState.ownedEquipmentIds, 'branch-saber'] }
    })).toBe(current)
    expect(updateGameRpgState(current, current.rpgState)).toBe(current)
    expect(current.dirty).toBe(false)
  })

  it('実際の変更だけが同じrevisionの次commitを要求する', () => {
    const current = {
      revision: 8,
      progress: createInitialPlayerProgress(),
      rpgState: createInitialRpgState(),
      dirty: false,
    }
    const next = updateGameProgress(current, (progress) => ({ ...progress, gold: 20 }))
    expect(next).toMatchObject({ revision: 8, dirty: true, progress: { gold: 20 } })
    expect(next.rpgState).toBe(current.rpgState)
  })
})
