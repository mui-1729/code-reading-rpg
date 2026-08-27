import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { openWorldTreasure } from './treasures'

describe('World treasure rewards', () => {
  it('JS TreasureはGoldとDebug Charmを一度だけ付与する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = createInitialRpgState()

    expect(rpgState.ownedEquipmentIds).not.toContain('debug-charm')

    const first = openWorldTreasure(progress, rpgState, 'js-debug-cache')
    expect(first.opened).toBe(true)
    expect(first.equipmentAwarded).toBe(true)
    expect(first.progress.gold).toBe(progress.gold + 20)
    expect(first.rpgState.ownedEquipmentIds).toContain('debug-charm')
    expect(first.rpgState.openedTreasureIds).toEqual(['js-debug-cache'])

    const second = openWorldTreasure(first.progress, first.rpgState, 'js-debug-cache')
    expect(second.opened).toBe(false)
    expect(second.progress).toBe(first.progress)
    expect(second.rpgState).toBe(first.rpgState)
  })

  it('Debug Charmを既に持つ旧saveでもJS TreasureのGoldは受け取れる', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = {
      ...createInitialRpgState(),
      ownedEquipmentIds: ['training-blade', 'traveler-coat', 'debug-charm'],
    }

    const result = openWorldTreasure(progress, rpgState, 'js-debug-cache')
    expect(result.opened).toBe(true)
    expect(result.equipmentAwarded).toBe(false)
    expect(result.progress.gold).toBe(20)
    expect(result.rpgState.ownedEquipmentIds.filter((id) => id === 'debug-charm')).toHaveLength(1)
  })

  it('TS TreasureはGoldとPATCH KITを一度だけ付与する', () => {
    const progress = createInitialPlayerProgress()
    const rpgState = createInitialRpgState()

    const result = openWorldTreasure(progress, rpgState, 'ts-supply-cache')
    expect(result.opened).toBe(true)
    expect(result.progress.gold).toBe(35)
    expect(result.progress.inventory.patchKit).toBe(1)
    expect(result.rpgState.openedTreasureIds).toEqual(['ts-supply-cache'])
  })
})
