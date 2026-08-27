import { describe, expect, it } from 'vitest'
import { npcById } from '../dialogue/npcs'
import { javascriptField } from '../field/javascriptField'
import { getLevelForExp } from '../progression'
import { mainQuests } from '../quests/quests'
import { JAVASCRIPT_AREA_ID } from './areas'
import { battles } from './battles'

const javascriptBattles = battles.filter((battle) => battle.areaId === JAVASCRIPT_AREA_ID)
const javascriptQuest = mainQuests.find((quest) => quest.areaId === JAVASCRIPT_AREA_ID)

describe('JavaScript story progression', () => {
  it('3 chapters follow one selector bug from issue to SEV-1', () => {
    expect(javascriptBattles.map((battle) => battle.label)).toEqual([
      'CHAPTER 01',
      'CHAPTER 02',
      'FINAL CHAPTER',
    ])
    expect(javascriptBattles[0]?.title).toBe('Issue #101: Wrong Target')
    expect(javascriptBattles[1]?.title).toBe('QA Triage: Selector Drift')
    expect(javascriptBattles[2]).toMatchObject({
      title: 'SEV-1: Targeting Outage',
      isBoss: true,
    })
    expect(javascriptBattles[0]?.subtitle).toContain('find()')
    expect(javascriptBattles[1]?.subtitle).toContain('配列順への暗黙依存')
    expect(javascriptBattles[2]?.subtitle).toContain('sort()/some()/reduce()')
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.name === 'Boss')).toBe(true)
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.attackName === 'Selector Cascade')).toBe(true)
  })

  it('uses engineering roles and an issue-to-postmortem quest flow', () => {
    expect(npcById.archivist).toMatchObject({ name: 'LEAD ADA', role: 'SENIOR ENGINEER' })
    expect(npcById['lambda-sage']).toMatchObject({ name: 'REVIEWER LAMBDA', role: 'CODE REVIEWER' })
    expect(npcById['byte-scout']).toMatchObject({ name: 'BYTE', role: 'QA ENGINEER' })

    expect(javascriptQuest?.title).toBe('Target Selector Incident')
    expect(javascriptQuest?.steps.map((step) => step.label)).toEqual([
      'Issue #101を再現し、find()の「最初の一致」と期待する優先対象のズレを特定する',
      'QA reportをtriageし、filter()/&&/||を使うselector群の影響範囲と共通前提を洗い出す',
      'SEV-1を復旧し、配列順への暗黙依存をsort()/reduce()で明示的な優先順位へ置き換える',
    ])
  })

  it('makes the root cause and prevention explicit in the postmortem dialogue', () => {
    const adaPostmortem = npcById.archivist?.dialogues.find(
      (dialogue) => dialogue.id === 'archivist-area-clear',
    )
    const bytePostmortem = npcById['byte-scout']?.dialogues.find(
      (dialogue) => dialogue.id === 'byte-area-clear',
    )

    expect(adaPostmortem?.lines.join(' ')).toContain('暗黙の前提')
    expect(adaPostmortem?.lines.join(' ')).toContain('sort()やreduce()')
    expect(bytePostmortem?.lines.join(' ')).toContain('順番shuffle test')
  })

  it('shows the three chapters as an engineering work queue on the field', () => {
    const battleLabels = javascriptField.interactions
      .filter((interaction) => interaction.kind === 'battle')
      .map((interaction) => interaction.label)

    expect(battleLabels).toEqual([
      'ISSUE #101 · BUG FIX',
      'QA TRIAGE · IMPACT',
      'SEV-1 · INCIDENT',
    ])
  })

  it('each chapter keeps every syntax learned in earlier chapters', () => {
    const chapter1 = new Set(javascriptBattles[0]?.skillIds ?? [])
    const chapter2 = new Set(javascriptBattles[1]?.skillIds ?? [])
    const finalChapter = new Set(javascriptBattles[2]?.skillIds ?? [])

    for (const skillId of chapter1) {
      expect(chapter2.has(skillId), `${skillId} should remain in chapter 2`).toBe(true)
      expect(finalChapter.has(skillId), `${skillId} should remain in the final chapter`).toBe(true)
    }

    for (const skillId of chapter2) {
      expect(finalChapter.has(skillId), `${skillId} should remain in the final chapter`).toBe(true)
    }
  })

  it('later chapters add new syntax instead of replacing old syntax', () => {
    expect(javascriptBattles[0]?.skillIds).toEqual(['trace', 'pulse', 'nova'])
    expect(javascriptBattles[1]?.skillIds).toEqual([
      'trace', 'pulse', 'nova', 'viper', 'lock', 'alert',
    ])
    expect(javascriptBattles[2]?.skillIds).toEqual([
      'trace', 'pulse', 'nova',
      'viper', 'lock', 'alert',
      'moon-edge', 'sweep', 'judge',
    ])
  })

  it('first clears naturally reach the next chapter level', () => {
    const chapter1Exp = javascriptBattles[0]?.expReward ?? 0
    const chapter2Exp = javascriptBattles[1]?.expReward ?? 0

    expect(getLevelForExp(0)).toBe(1)
    expect(getLevelForExp(chapter1Exp)).toBe(2)
    expect(getLevelForExp(chapter1Exp + chapter2Exp)).toBe(3)
  })
})
