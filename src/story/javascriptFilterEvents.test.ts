import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

describe('JavaScript filter lesson story', () => {
  it('find()とfilter()の意味差を普通の言葉から説明する', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.title).toBe('最初の一体ではなく、全部を見る')
    expect(text).toContain('find()')
    expect(text).toContain('filter()')
    expect(text).toContain('最初の一体')
    expect(text).toContain('全部集める')
    expect(text).toContain('HPが45未満')
  })

  it('Storyで現在盤面のcorrect target名を直接教えない', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).not.toContain('Slime')
    expect(text).not.toContain('Sprout')
    expect(text).not.toContain('Boar')
  })

  it('post Storyでもfind / filterの違いを短く復習する', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'post')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('find()')
    expect(text).toContain('filter()')
    expect(text).toContain('全部')
  })
})
