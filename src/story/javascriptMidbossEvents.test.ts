import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'
import { getJavaScriptMidbossStoryEvent } from './javascriptMidbossEvents'

describe('JavaScript Forest midboss story', () => {
  it('pre Storyは既習syntaxだけを振り返りcorrect targetを教えない', () => {
    const event = getJavaScriptMidbossStoryEvent(13, 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.title).toContain('今までの読み方')
    expect(text).toContain('find()')
    expect(text).toContain('&&')
    expect(text).toContain('||')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Sprout|Goblin|Guardian/)
  })

  it('post Storyは次の課題を普通の言葉で示しfilterという名前を先取りしない', () => {
    const event = getJavaScriptMidbossStoryEvent(13, 'post')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('まとめて集める')
    expect(text).not.toContain('filter()')
  })

  it('Battle story resolverからBattle 13のpre / postへ到達できる', () => {
    expect(getBattleStoryEvent('/javascript/battle/13', 'pre')?.id).toBe('js-forest-midboss-before')
    expect(getBattleStoryEvent('/javascript/battle/13', 'post')?.id).toBe('js-forest-midboss-after')
  })
})
