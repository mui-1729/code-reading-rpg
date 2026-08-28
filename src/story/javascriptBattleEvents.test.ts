import { describe, expect, it } from 'vitest'
import {
  getJavaScriptPostBattleEvent,
  getJavaScriptPreBattleEvent,
} from './javascriptBattleEvents'

describe('JavaScript battle story events', () => {
  it('Chapter 1 links CODE WORLD symptoms to the same REAL WORLD incident', () => {
    const event = getJavaScriptPostBattleEvent(1)
    expect(event?.title).toBe('直ったはずなのに')
    expect(event?.lines.some((line) => line.layer === 'code-world')).toBe(true)
    expect(event?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('REAL WORLD側'))).toBe(true)
  })

  it('Chapter 2 reveals Code Core as the shared root cause candidate', () => {
    const event = getJavaScriptPostBattleEvent(2)
    expect(event?.lines.some((line) => line.text.includes('Code Core'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('root cause'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('北西'))).toBe(true)
  })

  it('Final briefing stays connected to REAL WORLD and ending RETURNs to incident close', () => {
    const before = getJavaScriptPreBattleEvent(3)
    const after = getJavaScriptPostBattleEvent(3)

    expect(before?.title).toBe('Code Coreへ')
    expect(before?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(after?.title).toBe('JavaScript incident、解決')
    expect(after?.lines.some((line) => line.layer === 'return')).toBe(true)
    expect(after?.lines.some((line) => line.layer === 'real-world')).toBe(true)
    expect(after?.lines.some((line) => line.text.includes('incidentはclose'))).toBe(true)
    expect(after?.lines.some((line) => line.text.includes('初仕事'))).toBe(true)
  })

  it('non-story battles do not get JavaScript story events', () => {
    expect(getJavaScriptPreBattleEvent(1)).toBeUndefined()
    expect(getJavaScriptPostBattleEvent(4)).toBeUndefined()
  })
})
