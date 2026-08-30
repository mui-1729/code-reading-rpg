import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

describe('JavaScript filter incident story', () => {
  it('影響範囲を知る必要からfind()とfilter()の意味差を説明する', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('IMPACT RANGE')
    expect(text).toContain('incident')
    expect(text).toContain('find()')
    expect(text).toContain('filter()')
    expect(text).toContain('最初の一体')
    expect(text).toContain('全部集め')
    expect(text).toContain('HPが45未満')
  })

  it('Battle 14 Storyで現在盤面のcorrect target名を直接教えない', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).not.toContain('Slime')
    expect(text).not.toContain('Sprout')
    expect(text).not.toContain('Boar')
  })

  it('Battle 14後は二つ目のactual incidentへ自然につなぐ', () => {
    const event = getBattleStoryEvent('/javascript/battle/14', 'post')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('IMPACT MAPPED')
    expect(text).toContain('find()')
    expect(text).toContain('filter()')
    expect(text).toContain('Deep Forest')
    expect(text).toContain('実際のincident')
  })

  it('Battle 15ではshared trace上でfilter()の意味を保ったまま<と>の条件差を説明する', () => {
    const event = getBattleStoryEvent('/javascript/battle/15', 'pre')
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('FOLLOW SHARED TRACE')
    expect(text).toContain('filter()')
    expect(text).toContain('HPが45未満')
    expect(text).toContain('HPが65より大きい')
    expect(text).toContain('<')
    expect(text).toContain('>')
    expect(text).toContain('最後まで')
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
