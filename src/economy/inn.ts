import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'

export const INN_REST_PRICE = 20

export type InnRestReason = 'available' | 'full-hp' | 'insufficient-gold'

export type InnRestQuote = {
  currentHp: number
  maxHp: number
  healAmount: number
  price: number
  wallet: number
  afterRestGold: number | null
  shortage: number
  canRest: boolean
  reason: InnRestReason
}

export type InnRestResult = {
  rested: boolean
  reason: Exclude<InnRestReason, 'available'> | 'rested'
  quote: InnRestQuote
  progress: PlayerProgress
  rpgState: RpgState
}

export function getInnRestQuote(
  progress: PlayerProgress,
  rpgState: RpgState,
  maxHp: number,
): InnRestQuote {
  const normalizedMaxHp = Math.max(1, Math.floor(maxHp))
  const currentHp = Math.max(0, Math.min(rpgState.currentHp, normalizedMaxHp))
  const healAmount = Math.max(0, normalizedMaxHp - currentHp)
  const wallet = Math.max(0, progress.gold)

  if (healAmount === 0) {
    return {
      currentHp,
      maxHp: normalizedMaxHp,
      healAmount,
      price: INN_REST_PRICE,
      wallet,
      afterRestGold: wallet,
      shortage: 0,
      canRest: false,
      reason: 'full-hp',
    }
  }

  if (wallet < INN_REST_PRICE) {
    return {
      currentHp,
      maxHp: normalizedMaxHp,
      healAmount,
      price: INN_REST_PRICE,
      wallet,
      afterRestGold: null,
      shortage: INN_REST_PRICE - wallet,
      canRest: false,
      reason: 'insufficient-gold',
    }
  }

  return {
    currentHp,
    maxHp: normalizedMaxHp,
    healAmount,
    price: INN_REST_PRICE,
    wallet,
    afterRestGold: wallet - INN_REST_PRICE,
    shortage: 0,
    canRest: true,
    reason: 'available',
  }
}

export function resolveInnRest(
  progress: PlayerProgress,
  rpgState: RpgState,
  maxHp: number,
): InnRestResult {
  const quote = getInnRestQuote(progress, rpgState, maxHp)

  if (!quote.canRest) {
    return {
      rested: false,
      reason: quote.reason === 'full-hp' ? 'full-hp' : 'insufficient-gold',
      quote,
      progress,
      rpgState,
    }
  }

  return {
    rested: true,
    reason: 'rested',
    quote,
    progress: {
      ...progress,
      gold: quote.afterRestGold ?? progress.gold,
      inventory: { ...progress.inventory },
    },
    rpgState: {
      ...rpgState,
      currentHp: quote.maxHp,
    },
  }
}
