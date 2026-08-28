import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

describe('battle story event resolver', () => {
  it('resolves existing JavaScript story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/3', 'pre')?.title).toBe('Code Coreへ')
    expect(getBattleStoryEvent('/javascript/battle/1', 'post')?.title).toBe('直ったはずなのに')
  })

  it('resolves JavaScript Village Training story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/7', 'pre')?.title).toBe('まず、数字を一つ読む')
    expect(getBattleStoryEvent('/javascript/battle/8', 'pre')?.title).toBe('文字も値として読む')
    expect(getBattleStoryEvent('/javascript/battle/9', 'pre')?.title).toBe('前から探して、最初で止まる')
  })

  it('does not replay a pre-story after that Battle is cleared', () => {
    expect(getBattleStoryEvent('/javascript/battle/7', 'pre', [7])).toBeUndefined()
    expect(getBattleStoryEvent('/javascript/battle/8', 'pre', [7])).toBeDefined()
    expect(getBattleStoryEvent('/javascript/battle/1', 'post', [1])).toBeDefined()
  })

  it('resolves JavaScript Forest story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/10', 'pre')?.title).toBe('二つともtrueなら通る')
    expect(getBattleStoryEvent('/javascript/battle/11', 'pre')?.title).toBe('どちらかtrueなら通る')
    expect(getBattleStoryEvent('/javascript/battle/12', 'post')?.title).toBe('記号が増えても読む順番は同じ')
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
