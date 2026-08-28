import { describe, expect, it } from 'vitest'
import {
  getTypeScriptPostBattleEvent,
  getTypeScriptPreBattleEvent,
} from './typescriptBattleEvents'

describe('TypeScript battle story events', () => {
  it('Chapter 1 starts as a new REAL WORLD API incident then enters CODE WORLD', () => {
    const event = getTypeScriptPreBattleEvent(4)

    expect(event?.title).toBe('API更新後の型ずれ')
    expect(event?.label).toBe('NEW INCIDENT')
    expect(event?.lines[0]?.layer).toBe('real-world')
    expect(event?.lines.some((line) => line.text.includes('Enemy API'))).toBe(true)
    expect(event?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(event?.lines.some((line) => line.layer === 'code-world')).toBe(true)
  })

  it('Chapter 1 clear leads into union / optional investigation across both layers', () => {
    const event = getTypeScriptPostBattleEvent(4)

    expect(event?.title).toBe('入口だけの問題じゃない')
    expect(event?.lines.some((line) => line.text.includes('union'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('optional'))).toBe(true)
    expect(event?.lines.some((line) => line.layer === 'remote')).toBe(true)
  })

  it('Chapter 2 clear reveals the Shared Contract root cause', () => {
    const event = getTypeScriptPostBattleEvent(5)

    expect(event?.title).toBe('Shared Contractにつながった')
    expect(event?.lines.some((line) => line.text.includes('TargetPolicy'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('Frontier Compiler'))).toBe(true)
    expect(event?.lines.some((line) => line.text.includes('root cause'))).toBe(true)
  })

  it('Final RETURNs from CODE WORLD and closes the REAL WORLD incident', () => {
    const before = getTypeScriptPreBattleEvent(6)
    const after = getTypeScriptPostBattleEvent(6)

    expect(before?.title).toBe('Frontier Compilerへ')
    expect(after?.title).toBe('TypeScript incident、解決')
    expect(after?.lines.some((line) => line.layer === 'return')).toBe(true)
    expect(after?.lines.some((line) => line.layer === 'real-world')).toBe(true)
    expect(after?.lines.some((line) => line.text.includes('incidentはclose'))).toBe(true)
  })

  it('non-TypeScript battles do not get TypeScript story events', () => {
    expect(getTypeScriptPreBattleEvent(3)).toBeUndefined()
    expect(getTypeScriptPostBattleEvent(3)).toBeUndefined()
  })
})
