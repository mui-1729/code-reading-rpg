import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import {
  consumePatchKit,
  PATCH_KIT_HEAL,
  PATCH_KIT_PRICE,
  purchasePatchKit,
} from './economy'

describe('economy', () => {
  it('Goldを消費してPATCH KITを購入する', () => {
    const progress = { ...createInitialPlayerProgress(), gold: PATCH_KIT_PRICE }
    const result = purchasePatchKit(progress)

    expect(result.purchased).toBe(true)
    expect(result.progress.gold).toBe(0)
    expect(result.progress.inventory.patchKit).toBe(1)
    expect(progress.gold).toBe(PATCH_KIT_PRICE)
    expect(progress.inventory.patchKit).toBe(0)
  })

  it('Gold不足では購入しない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: PATCH_KIT_PRICE - 1 }
    const result = purchasePatchKit(progress)

    expect(result.purchased).toBe(false)
    expect(result.progress).toBe(progress)
  })

  it(`PATCH KITは最大${PATCH_KIT_HEAL}HP回復して1個消費する`, () => {
    const progress = {
      ...createInitialPlayerProgress(),
      inventory: { patchKit: 2 },
    }
    const result = consumePatchKit(progress, 50, 100)

    expect(result.consumed).toBe(true)
    expect(result.healed).toBe(PATCH_KIT_HEAL)
    expect(result.hp).toBe(50 + PATCH_KIT_HEAL)
    expect(result.progress.inventory.patchKit).toBe(1)
    expect(progress.inventory.patchKit).toBe(2)
  })

  it('最大HPを超えて回復しない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      inventory: { patchKit: 1 },
    }
    const result = consumePatchKit(progress, 90, 100)

    expect(result.consumed).toBe(true)
    expect(result.healed).toBe(10)
    expect(result.hp).toBe(100)
  })

  it('HP満タンではPATCH KITを消費しない', () => {
    const progress = {
      ...createInitialPlayerProgress(),
      inventory: { patchKit: 1 },
    }
    const result = consumePatchKit(progress, 100, 100)

    expect(result.consumed).toBe(false)
    expect(result.progress).toBe(progress)
    expect(result.progress.inventory.patchKit).toBe(1)
  })

  it('所持していなければ回復しない', () => {
    const progress = createInitialPlayerProgress()
    const result = consumePatchKit(progress, 50, 100)

    expect(result.consumed).toBe(false)
    expect(result.hp).toBe(50)
  })
})
