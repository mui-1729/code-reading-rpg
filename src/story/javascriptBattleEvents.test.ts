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

  it('Village Training 7はenemy.hpと比較記号を普通の言葉から説明する', () => {
    const event = getJavaScriptPreBattleEvent(7)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.title).toBe('まず、数字を一つ読む')
    expect(text).toContain('enemy.hp')
    expect(text).toContain('`<`')
    expect(text).toContain('`>`')
    expect(text).toContain('find()')
    expect(text).toContain('今は中の「HPをどう比べているか」に注目')
    expect(text).not.toMatch(/Sprout|Boar/)
  })

  it('Village Training 8はenemy.nameと===を説明し正解Enemyを直接教えない', () => {
    const event = getJavaScriptPreBattleEvent(8)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('enemy.name')
    expect(text).toContain('`===`')
    expect(text).not.toMatch(/Goblin|Golem/)
  })

  it('Village Training 9はenemiesとfind()を前から最初の一体として説明する', () => {
    const event = getJavaScriptPreBattleEvent(9)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('enemies')
    expect(text).toContain('find()')
    expect(text).toContain('前から')
    expect(text).toContain('最初')
    expect(text).not.toMatch(/Slime|Goblin|Golem/)
  })

  it('Forest 10は&&を「左右ともtrue」と説明しfilterを先取りしない', () => {
    const event = getJavaScriptPreBattleEvent(10)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.title).toBe('二つともtrueなら通る')
    expect(text).toContain('`&&`')
    expect(text).toContain('左もtrue、右もtrue')
    expect(text).toContain('find()')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Sprout|Goblin|Boar/)
  })

  it('Forest 11は||を「どちらか一方でもtrue」と説明し正解Enemyを直接教えない', () => {
    const event = getJavaScriptPreBattleEvent(11)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('`||`')
    expect(text).toContain('どちらか一方でもtrue')
    expect(text).toContain('かっこ')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Slime|Goblin|Boar/)
  })

  it('Forest 12は新syntaxを増やさず&& / ||を小さく分けて読む', () => {
    const before = getJavaScriptPreBattleEvent(12)
    const after = getJavaScriptPostBattleEvent(12)
    const beforeText = before?.lines.map((line) => line.text).join('\n') ?? ''
    const afterText = after?.lines.map((line) => line.text).join('\n') ?? ''

    expect(beforeText).toContain('新しい記号は増えない')
    expect(beforeText).toContain('&&と||')
    expect(beforeText).toContain('find()')
    expect(beforeText).not.toContain('filter()')
    expect(afterText).toContain('読む順番')
  })

  it('Forest 10 / 11は戦闘後も&& / ||の違いを短く復習する', () => {
    expect(getJavaScriptPostBattleEvent(10)?.lines[0]?.text).toContain('&&')
    expect(getJavaScriptPostBattleEvent(11)?.lines[0]?.text).toContain('||')
  })

  it('non-story battles do not get unrelated JavaScript story events', () => {
    expect(getJavaScriptPreBattleEvent(1)).toBeUndefined()
    expect(getJavaScriptPostBattleEvent(4)).toBeUndefined()
  })
})
