import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg/state'
import { JS_FOREST_MAP_ID } from '../world/worldMap'
import { getShopItemQuote, purchaseShopItem } from './shop'

describe('regional map charts', () => {
  it('Goldを使って地域地図を購入しRPG stateへ所有状態を残す', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 100 }
    const rpgState = createInitialRpgState()

    const result = purchaseShopItem(progress, rpgState, 'js-forest-chart')

    expect(result.purchased).toBe(true)
    expect(result.progress.gold).toBe(55)
    expect(result.rpgState.ownedWorldMapIds).toContain(JS_FOREST_MAP_ID)
    expect(getShopItemQuote(result.progress, result.rpgState, 'js-forest-chart')?.state).toBe('owned')
  })

  it('購入済み地図は二重購入できない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 100 }
    const rpgState = {
      ...createInitialRpgState(),
      ownedWorldMapIds: [JS_FOREST_MAP_ID],
    }

    const result = purchaseShopItem(progress, rpgState, 'js-forest-chart')
    expect(result.purchased).toBe(false)
    expect(result.reason).toBe('owned')
    expect(result.progress.gold).toBe(100)
  })
})
