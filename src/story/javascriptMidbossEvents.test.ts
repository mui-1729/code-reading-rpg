import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'
import { getJavaScriptMidbossStoryEvent } from './javascriptMidbossEvents'

describe('JavaScript Forest trace guardian story', () => {
  it('pre Storyは既習syntaxだけでtrace blockerを突破させcorrect targetを教えない', () => {
    const event = getJavaScriptMidbossStoryEvent(13, 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('TRACE BLOCKED')
    expect(text).toContain('trace')
    expect(text).toContain('find()')
    expect(text).toContain('&&')
    expect(text).toContain('||')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Sprout|Goblin|Guardian/)
  })

  it('post StoryはREAL WORLDの影響拡大を受けて複数target調査の必要性を作る', () => {
    const event = getJavaScriptMidbossStoryEvent(13, 'post')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('TRACE PATH OPEN')
    expect(event?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(text).toContain('複数')
    expect(text).toContain('全部集め')
    expect(text).not.toContain('filter()')
  })

  it('Battle story resolverからBattle 13のpre / postへ到達できる', () => {
    expect(getBattleStoryEvent('/javascript/battle/13', 'pre')?.id).toBe('js-forest-midboss-before')
    expect(getBattleStoryEvent('/javascript/battle/13', 'post')?.id).toBe('js-forest-midboss-after')
  })
})
