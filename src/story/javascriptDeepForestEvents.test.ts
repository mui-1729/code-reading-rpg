import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

function storyText(battleId: number, phase: 'pre' | 'post' = 'pre') {
  const event = getBattleStoryEvent(`/javascript/battle/${battleId}`, phase)
  return event?.lines.map((line) => line.text).join('\n') ?? ''
}

describe('JavaScript Deep Forest root-cause story', () => {
  it('Battle 16はtraceのdata形が変わる必要からmap()を説明する', () => {
    const event = getBattleStoryEvent('/javascript/battle/16', 'pre')
    const text = storyText(16)
    expect(event?.label).toBe('TRACE TRANSFORMED')
    expect(text).toContain('別の形へ変え')
    expect(text).toContain('map()')
    expect(text).toContain('find()')
  })

  it('Battle 17 / 18はalarmとbarrierのruleとしてsome() / every()をbooleanで区別する', () => {
    const some = storyText(17)
    const every = storyText(18)

    expect(some).toContain('alarm')
    expect(some).toContain('some()')
    expect(some).toContain('true')
    expect(some).toContain('false')
    expect(some).toContain('一つでも')
    expect(every).toContain('barrier')
    expect(every).toContain('every()')
    expect(every).toContain('全部')
    expect(every).toContain('true')
  })

  it('Battle 17 postはREAL WORLD monitorとの一致を返す', () => {
    const event = getBattleStoryEvent('/javascript/battle/17', 'post')
    const text = storyText(17, 'post')

    expect(event?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(text).toContain('REAL WORLD')
    expect(text).toContain('monitor')
  })

  it('Battle 19はnew syntaxを導入せずtrace junctionを既習conceptで突破する', () => {
    const text = storyText(19)
    expect(text).toContain('trace')
    expect(text).toContain('新しいsyntaxはない')
    expect(text).toContain('filter()')
    expect(text).toContain('map()')
    expect(text).toContain('some()')
    expect(text).toContain('every()')
  })

  it('Battle 20〜22でpriority / missing data / final aggregationを順番に読む', () => {
    const sort = storyText(20)
    const safe = storyText(21)
    const reduce = storyText(22)

    expect(sort).toContain('sort(')
    expect(sort).toContain('[0]')
    expect(sort).toContain('byHp')
    expect(safe).toContain('?.')
    expect(safe).toContain('??')
    expect(safe).toContain('stats')
    expect(safe).toContain('REAL WORLD')
    expect(reduce).toContain('reduce()')
    expect(reduce).toContain('best')
  })

  it('Battle 22後は来た道を戻さずDeep Forest西口からCode Coreへ直結する', () => {
    const event = getBattleStoryEvent('/javascript/battle/22', 'post')
    const text = storyText(22, 'post')

    expect(event?.label).toBe('ROOT CAUSE LOCATED')
    expect(text).toContain('Code Core')
    expect(text).toContain('西口')
    expect(text).toContain('戻る必要はない')
    expect(text).not.toContain('草原へ戻')
    expect(text).not.toContain('二戦')
  })

  it.each([16, 17, 18, 20, 21, 22])(
    'Battle %i pre Storyは現在盤面のEnemy名を答えとして公開しない',
    (battleId) => {
      const text = storyText(battleId)
      expect(text).not.toMatch(/Slime|Goblin|Guardian/)
    },
  )
})
