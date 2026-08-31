import { describe, expect, it } from 'vitest'
import { createBattleSession, validateBattleSearch } from './session'

describe('battle session identity', () => {
  it('return pathはregistered legacy fieldかWorldだけを受け付ける', () => {
    expect(validateBattleSearch({ seed: 'seed', returnTo: '/typescript/field' })).toEqual({ seed: 'seed', returnTo: '/typescript/field' })
    expect(validateBattleSearch({ seed: '', returnTo: 'https://example.test' })).toEqual({ seed: undefined, returnTo: undefined })
  })
  it('keeps battleId / seed / returnTo together with the generated battle', () => {
    const session = createBattleSession(7, 'session-seed', '/world')

    expect(session.battleId).toBe(7)
    expect(session.seed).toBe('session-seed')
    expect(session.returnTo).toBe('/world')
    expect(session.battle.id).toBe(7)
  })

  it('resolves the next battle only inside the same learning area', () => {
    expect(createBattleSession(1, 'incident-first').nextBattle?.id).toBe(7)
    expect(createBattleSession(7, 'a').nextBattle?.id).toBe(8)
    expect(createBattleSession(14, 'second-symptom').nextBattle?.id).toBe(2)
    expect(createBattleSession(22, 'core-approach').nextBattle?.id).toBe(3)
    expect(createBattleSession(3, 'b').nextBattle).toBeUndefined()
    expect(createBattleSession(4, 'c').nextBattle?.id).toBe(5)
    expect(createBattleSession(6, 'd').nextBattle).toBeUndefined()
  })

  it('rejects unknown battle IDs before the runtime renders', () => {
    expect(() => createBattleSession(999, 'unknown')).toThrow('Unknown battle: 999')
  })
})
