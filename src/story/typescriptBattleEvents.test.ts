import { describe, expect, it } from 'vitest'
import {
  getTypeScriptPostBattleEvent,
  getTypeScriptPreBattleEvent,
} from './typescriptBattleEvents'

describe('TypeScript battle story events', () => {
  it('Chapter 1 starts from the API contract incident', () => {
    const event = getTypeScriptPreBattleEvent(4)

    expect(event?.title).toBe('API更新後の型ずれ')
    expect(event?.lines.some((line) => line.text.includes('Enemy API'))).toBe(true)
  })

  it('Chapter 1 clear leads into union / optional investigation', () => {
    const event = getTypeScriptPostBattleEvent(4)

    expect(event?.title).toBe('入口だけの問題じゃない')
    expect(event?.lines.some((line) => line.text.includes('union'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('optional'))).toBe(true)
  })

  it('Chapter 2 clear reveals the Shared Contract root cause', () => {
    const event = getTypeScriptPostBattleEvent(5)

    expect(event?.title).toBe('Shared Contractにつながった')
    expect(event?.lines.some((line) => line.text.includes('TargetPolicy'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('Frontier Compiler'))).toBe(true)
  })

  it('Final has a briefing before battle and an ending after victory', () => {
    const before = getTypeScriptPreBattleEvent(6)
    const after = getTypeScriptPostBattleEvent(6)

    expect(before?.title).toBe('Frontier Compilerへ')
    expect(after?.title).toBe('TypeScript Frontier、復旧')
    expect(after?.lines.some((line) => line.text.includes('incident close'))).toBe(true)
  })

  it('non-TypeScript battles do not get TypeScript story events', () => {
    expect(getTypeScriptPreBattleEvent(3)).toBeUndefined()
    expect(getTypeScriptPostBattleEvent(3)).toBeUndefined()
  })
})
