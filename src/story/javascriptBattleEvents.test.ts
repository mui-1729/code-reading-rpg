import { describe, expect, it } from 'vitest'
import {
  getJavaScriptPostBattleEvent,
  getJavaScriptPreBattleEvent,
} from './javascriptBattleEvents'

describe('JavaScript battle story events', () => {
  it('first incident is an actual early gameplay beat connected to REAL WORLD', () => {
    const before = getJavaScriptPreBattleEvent(1)
    const after = getJavaScriptPostBattleEvent(1)
    const beforeText = before?.lines.map((line) => line.text).join('\n') ?? ''
    const afterText = after?.lines.map((line) => line.text).join('\n') ?? ''

    expect(before?.label).toBe('LIVE INCIDENT')
    expect(beforeText).toContain('訓練用じゃない')
    expect(beforeText).toContain('実際')
    expect(beforeText).not.toMatch(/Slime|Goblin|Golem/)
    expect(after?.title).toBe('最初の症状をつかんだ')
    expect(after?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(afterText).toContain('REAL WORLD側')
    expect(afterText).toContain('Forest')
  })

  it('second incident appears after impact-range investigation and keeps the route moving forward', () => {
    const before = getJavaScriptPreBattleEvent(2)
    const after = getJavaScriptPostBattleEvent(2)
    const beforeText = before?.lines.map((line) => line.text).join('\n') ?? ''
    const afterText = after?.lines.map((line) => line.text).join('\n') ?? ''

    expect(before?.label).toBe('SECOND SYMPTOM')
    expect(beforeText).toContain('複数')
    expect(beforeText).toContain('filter()')
    expect(beforeText).not.toMatch(/Slime|Goblin|Golem/)
    expect(afterText).toContain('同じcall path')
    expect(afterText).toContain('戻る必要はない')
    expect(afterText).not.toContain('root causeと断定')
  })

  it('Final briefing follows the same trace forward and ending RETURNs to incident close', () => {
    const before = getJavaScriptPreBattleEvent(3)
    const after = getJavaScriptPostBattleEvent(3)
    const beforeText = before?.lines.map((line) => line.text).join('\n') ?? ''

    expect(before?.title).toBe('Code Coreへ')
    expect(beforeText).toContain('Deep Forest')
    expect(beforeText).toContain('戻って別の場所を探す必要はない')
    expect(before?.lines.some((line) => line.layer === 'remote')).toBe(true)
    expect(after?.title).toBe('JavaScript incident、解決')
    expect(after?.lines.some((line) => line.layer === 'return')).toBe(true)
    expect(after?.lines.some((line) => line.layer === 'real-world')).toBe(true)
    expect(after?.lines.some((line) => line.text.includes('incidentはclose'))).toBe(true)
    expect(after?.lines.some((line) => line.text.includes('初仕事'))).toBe(true)
  })

  it('Village 7はincident logを読む必要からenemy.hpと比較記号を導入する', () => {
    const event = getJavaScriptPreBattleEvent(7)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('INCIDENT PREP')
    expect(text).toContain('incident')
    expect(text).toContain('enemy.hp')
    expect(text).toContain('`<`')
    expect(text).toContain('`>`')
    expect(text).toContain('find()')
    expect(text).not.toMatch(/Sprout|Boar/)
  })

  it('Village 8はincidentの別条件としてenemy.nameと===を説明し正解Enemyを教えない', () => {
    const event = getJavaScriptPreBattleEvent(8)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('incident')
    expect(text).toContain('enemy.name')
    expect(text).toContain('`===`')
    expect(text).not.toMatch(/Goblin|Golem/)
  })

  it('Village 9はactual selectorとしてenemiesとfind()を説明しfield checkへ接続する', () => {
    const before = getJavaScriptPreBattleEvent(9)
    const after = getJavaScriptPostBattleEvent(9)
    const text = before?.lines.map((line) => line.text).join('\n') ?? ''
    const afterText = after?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('incident')
    expect(text).toContain('enemies')
    expect(text).toContain('find()')
    expect(text).toContain('前から')
    expect(text).toContain('最初')
    expect(text).not.toMatch(/Slime|Goblin|Golem/)
    expect(after?.label).toBe('FIELD CHECK READY')
    expect(afterText).toContain('実際')
  })

  it('Forest 10はincident trace上の&&を左右ともtrueとして説明しfilterを先取りしない', () => {
    const event = getJavaScriptPreBattleEvent(10)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(event?.label).toBe('FOLLOW THE TRACE')
    expect(text).toContain('trace')
    expect(text).toContain('`&&`')
    expect(text).toContain('左もtrue、右もtrue')
    expect(text).toContain('find()')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Sprout|Goblin|Boar/)
  })

  it('Forest 11は別trace入口として||を説明し正解Enemyを直接教えない', () => {
    const event = getJavaScriptPreBattleEvent(11)
    const text = event?.lines.map((line) => line.text).join('\n') ?? ''

    expect(text).toContain('`||`')
    expect(text).toContain('どちらか一方でもtrue')
    expect(text).toContain('かっこ')
    expect(text).not.toContain('filter()')
    expect(text).not.toMatch(/Slime|Goblin|Boar/)
  })

  it('Forest 12はnew syntaxを増やさずtrace junctionを既習条件で読む', () => {
    const before = getJavaScriptPreBattleEvent(12)
    const after = getJavaScriptPostBattleEvent(12)
    const beforeText = before?.lines.map((line) => line.text).join('\n') ?? ''
    const afterText = after?.lines.map((line) => line.text).join('\n') ?? ''

    expect(beforeText).toContain('新しい記号は増えない')
    expect(beforeText).toContain('&&と||')
    expect(beforeText).toContain('find()')
    expect(beforeText).not.toContain('filter()')
    expect(after?.label).toBe('TRACE CONVERGED')
    expect(afterText).toContain('守り人')
  })

  it('Forest 10 / 11のpost Storyもsyntax名だけでなくincident traceへ意味を戻す', () => {
    expect(getJavaScriptPostBattleEvent(10)?.lines[0]?.text).toContain('trace')
    expect(getJavaScriptPostBattleEvent(11)?.lines[0]?.text).toContain('経路')
  })

  it('unrelated TypeScript battle does not get JavaScript story events', () => {
    expect(getJavaScriptPostBattleEvent(4)).toBeUndefined()
  })
})
