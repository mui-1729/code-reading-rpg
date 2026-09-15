import { describe, expect, it } from 'vitest'
import { getStoryLayerTransitionKind } from './storyLayerTransition'

describe('getStoryLayerTransitionKind', () => {
  it('REAL/REMOTEからCODE WORLDへ入る境界をconnectとして扱う', () => {
    expect(getStoryLayerTransitionKind('real-world', 'connect')).toBe('connect')
    expect(getStoryLayerTransitionKind('remote', 'code-world')).toBe('connect')
  })

  it('CODE WORLDからRETURN/REAL WORLDへ戻る境界をreturn-real-worldとして扱う', () => {
    expect(getStoryLayerTransitionKind('code-world', 'return')).toBe('return-real-world')
    expect(getStoryLayerTransitionKind('code-world', 'real-world')).toBe('return-real-world')
  })

  it('REMOTE表示やRETURN後の同一側lineでは重いtransitionを繰り返さない', () => {
    expect(getStoryLayerTransitionKind('real-world', 'remote')).toBeNull()
    expect(getStoryLayerTransitionKind('return', 'real-world')).toBeNull()
    expect(getStoryLayerTransitionKind('code-world', 'remote')).toBeNull()
    expect(getStoryLayerTransitionKind('code-world', 'code-world')).toBeNull()
  })
})
