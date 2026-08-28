import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression'
import { createInitialRpgState } from '../rpg'
import { getInnRestQuote, INN_REST_PRICE, resolveInnRest } from './inn'

describe('Inn / Rest', () => {
  it('fixed 20Gで不足HPをfull recoveryするquoteを返す', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 70 }
    const rpgState = { ...createInitialRpgState(), currentHp: 43 }
    const quote = getInnRestQuote(progress, rpgState, 108)

    expect(quote).toEqual({
      currentHp: 43,
      maxHp: 108,
      healAmount: 65,
      price: INN_REST_PRICE,
      wallet: 70,
      afterRestGold: 50,
      shortage: 0,
      canRest: true,
      reason: 'available',
    })
  })

  it('成功時だけGold -20とHP fullを同時に返す', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 70 }
    const rpgState = { ...createInitialRpgState(), currentHp: 43 }
    const result = resolveInnRest(progress, rpgState, 108)

    expect(result.rested).toBe(true)
    expect(result.reason).toBe('rested')
    expect(result.progress.gold).toBe(50)
    expect(result.rpgState.currentHp).toBe(108)
    expect(progress.gold).toBe(70)
    expect(rpgState.currentHp).toBe(43)
  })

  it('full HPではchargeせずstateを変更しない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 70 }
    const rpgState = { ...createInitialRpgState(), currentHp: 108 }
    const result = resolveInnRest(progress, rpgState, 108)

    expect(result.rested).toBe(false)
    expect(result.reason).toBe('full-hp')
    expect(result.quote.healAmount).toBe(0)
    expect(result.quote.afterRestGold).toBe(70)
    expect(result.progress).toBe(progress)
    expect(result.rpgState).toBe(rpgState)
  })

  it('Gold不足では不足額を返しHP / Goldを変更しない', () => {
    const progress = { ...createInitialPlayerProgress(), gold: 7 }
    const rpgState = { ...createInitialRpgState(), currentHp: 43 }
    const result = resolveInnRest(progress, rpgState, 108)

    expect(result.rested).toBe(false)
    expect(result.reason).toBe('insufficient-gold')
    expect(result.quote.shortage).toBe(13)
    expect(result.quote.afterRestGold).toBeNull()
    expect(result.progress).toBe(progress)
    expect(result.rpgState).toBe(rpgState)
  })

  it('exact 20Gなら0Gまで支払ってrestできる', () => {
    const progress = { ...createInitialPlayerProgress(), gold: INN_REST_PRICE }
    const rpgState = { ...createInitialRpgState(), currentHp: 1 }
    const result = resolveInnRest(progress, rpgState, 108)

    expect(result.rested).toBe(true)
    expect(result.progress.gold).toBe(0)
    expect(result.rpgState.currentHp).toBe(108)
  })
})
