import { describe, expect, it } from 'vitest'
import { getBattleStoryEvent } from './battleStoryEvents'

describe('battle story event resolver', () => {
  it('最初のJavaScript incidentは観察→不足把握の順でStoryを返す', () => {
    expect(getBattleStoryEvent('/javascript/battle/1', 'pre')?.title).toBe('まず、異常そのものを見る')
    expect(getBattleStoryEvent('/javascript/battle/1', 'post')?.title).toBe('異常は見えた。次は読める材料を増やす')
    expect(getBattleStoryEvent('/javascript/battle/3', 'pre')?.title).toBe('Code Coreへ')
  })

  it('resolves JavaScript Village Training story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/7', 'pre')?.title).toBe('まず、ログの数字を一つ読む')
    expect(getBattleStoryEvent('/javascript/battle/8', 'pre')?.title).toBe('ログにある名前の条件も読む')
    expect(getBattleStoryEvent('/javascript/battle/9', 'pre')?.title).toBe('実際のselectorがどこで止まるか追う')
    expect(getBattleStoryEvent('/javascript/battle/9', 'post')?.title).toBe('さっき見た異常を、今度は読んで追える')
  })

  it('does not replay a pre-story after that Battle is cleared', () => {
    expect(getBattleStoryEvent('/javascript/battle/1', 'pre', [1])).toBeUndefined()
    expect(getBattleStoryEvent('/javascript/battle/7', 'pre', [1, 7])).toBeUndefined()
    expect(getBattleStoryEvent('/javascript/battle/8', 'pre', [1, 7])).toBeDefined()
    expect(getBattleStoryEvent('/javascript/battle/1', 'post', [1])).toBeDefined()
  })

  it('resolves JavaScript Forest story events', () => {
    expect(getBattleStoryEvent('/javascript/battle/10', 'pre')?.title).toBe('二つの条件を通る経路を追う')
    expect(getBattleStoryEvent('/javascript/battle/11', 'pre')?.title).toBe('別の入口からも同じ異常へ入る')
    expect(getBattleStoryEvent('/javascript/battle/12', 'post')?.title).toBe('複数の条件が一つの経路へ集まった')
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
