import { describe, expect, it } from 'vitest'
import { createBattleSession } from './session'

describe('battle session identity', () => {
  it('keeps battleId / seed / returnTo together with the generated battle', () => {
    const session = createBattleSession(7, 'session-seed', '/world')

    expect(session.battleId).toBe(7)
    expect(session.seed).toBe('session-seed')
    expect(session.returnTo).toBe('/world')
    expect(session.battle.id).toBe(7)
  })

  it('resolves the next battle only inside the same learning area', () => {
    expect(createBattleSession(7, 'a').nextBattle?.id).toBe(8)
    expect(createBattleSession(3, 'b').nextBattle).toBeUndefined()
    expect(createBattleSession(4, 'c').nextBattle?.id).toBe(5)
    expect(createBattleSession(6, 'd').nextBattle).toBeUndefined()
  })

  it('rejects unknown battle IDs before the runtime renders', () => {
    expect(() => createBattleSession(999, 'unknown')).toThrow('Unknown battle: 999')
  })
})
