import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

function storyText(battleId: number, phase: 'pre' | 'post' = 'pre') {
  const event = getBattleStoryEvent(`/javascript/battle/${battleId}`, phase)
  return event?.lines.map((line) => line.text).join('\n') ?? ''
}

describe('JavaScript Deep Forest final story', () => {
  it('Battle 16は普通の言葉からmap()の変換を説明する', () => {
    const text = storyText(16)
    expect(text).toContain('別の形へ変える')
    expect(text).toContain('map()')
    expect(text).toContain('find()')
  })

  it('Battle 17 / 18はsome()とevery()をbooleanとして区別する', () => {
    const some = storyText(17)
    const every = storyText(18)

    expect(some).toContain('some()')
    expect(some).toContain('true')
    expect(some).toContain('false')
    expect(some).toContain('一つでも')
    expect(every).toContain('every()')
    expect(every).toContain('全部')
    expect(every).toContain('true')
  })

  it('Battle 19はnew syntaxを導入せず既習conceptの理解確認にする', () => {
    const text = storyText(19)
    expect(text).toContain('新しいsyntaxはない')
    expect(text).toContain('filter()')
    expect(text).toContain('map()')
    expect(text).toContain('some()')
    expect(text).toContain('every()')
  })

  it('Battle 20〜22でsort / optional+nullish / reduceを順番に説明する', () => {
    const sort = storyText(20)
    const safe = storyText(21)
    const reduce = storyText(22)

    expect(sort).toContain('sort()')
    expect(sort).toContain('[0]')
    expect(sort).toContain('ordered')
    expect(safe).toContain('?.')
    expect(safe).toContain('??')
    expect(safe).toContain('optional chaining')
    expect(reduce).toContain('reduce()')
    expect(reduce).toContain('best')
  })

  it('Battle 22後はOverworldの二つの異変からCode Core Final Bossへ誘導する', () => {
    const text = storyText(22, 'post')
    expect(text).toContain('草原へ戻り')
    expect(text).toContain('二戦')
    expect(text).toContain('Code Core')
    expect(text).toContain('Final Boss')
  })

  it.each([16, 17, 18, 20, 21, 22])('Battle %i pre Storyは現在盤面のEnemy名を答えとして公開しない', (battleId) => {
    const text = storyText(battleId)
    expect(text).not.toMatch(/Slime|Goblin|Guardian/)
  })
})
