import { describe, expect, it } from 'vitest'
import {
  getJavaScriptPostBattleEvent,
  getJavaScriptPreBattleEvent,
} from './javascriptBattleEvents'

describe('JavaScript battle story events', () => {
  it('Chapter 1 clear leaves a clue that leads into Chapter 2', () => {
    const event = getJavaScriptPostBattleEvent(1)
    expect(event?.title).toBe('直ったはずなのに')
    expect(event?.lines.some((line) => line.text.includes('別のログ'))).toBe(true)
  })

  it('Chapter 2 clear reveals Code Core as the next destination', () => {
    const event = getJavaScriptPostBattleEvent(2)
    expect(event?.lines.some((line) => line.text.includes('Code Core'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('北西'))).toBe(true)
  })

  it('Final has a briefing before battle and an ending after victory', () => {
    const before = getJavaScriptPreBattleEvent(3)
    const after = getJavaScriptPostBattleEvent(3)

    expect(before?.title).toBe('Code Coreへ')
    expect(after?.title).toBe('JavaScript王国、復旧')
    expect(after?.lines.some((line) => line.text.includes('初仕事'))).toBe(true)
  })

  it('non-story battles do not get JavaScript story events', () => {
    expect(getJavaScriptPreBattleEvent(1)).toBeUndefined()
    expect(getJavaScriptPostBattleEvent(4)).toBeUndefined()
  })
})
