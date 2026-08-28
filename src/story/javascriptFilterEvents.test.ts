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

  it('Battle 14 Storyで現在盤面のcorrect target名を直接教えない', () => {
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

  it('Battle 15ではfilter()の意味を保ったまま<と>の条件差を説明する', () => {
    const event = getBattleStoryEvent('/javascript/battle/15', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.title).toBe('条件の向きが変わっても、全部を見る')
    expect(text).toContain('filter()')
    expect(text).toContain('HPが45未満')
    expect(text).toContain('HPが65より大きい')
    expect(text).toContain('<')
    expect(text).toContain('>')
    expect(text).toContain('全部集める')
  })

  it('Battle 15 Storyでcorrect target名や対象数を公開しない', () => {
    const event = getBattleStoryEvent('/javascript/battle/15', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).not.toContain('Slime')
    expect(text).not.toContain('Boar')
    expect(text).not.toContain('Guardian')
    expect(text).not.toMatch(/\b[1234]体\b/)
  })
})
