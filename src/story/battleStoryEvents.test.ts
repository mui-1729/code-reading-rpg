import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

describe('battle story event resolver', () => {
  it('resolves existing JavaScript story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/3', 'pre')?.title).toBe('Code Coreへ')
    expect(getBattleStoryEvent('/javascript/battle/1', 'post')?.title).toBe('直ったはずなのに')
  })

  it('resolves TypeScript story events', () => {
    expect(getBattleStoryEvent('/typescript/battle/4', 'pre')?.title).toBe('API更新後の型ずれ')
    expect(getBattleStoryEvent('/typescript/battle/5', 'post')?.title).toBe('Shared Contractにつながった')
  })

  it('returns undefined for unrelated paths or missing phases', () => {
    expect(getBattleStoryEvent('/world', 'pre')).toBeUndefined()
    expect(getBattleStoryEvent('/typescript/battle/5', 'pre')).toBeUndefined()
  })
})
