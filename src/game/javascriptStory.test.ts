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
  it('3 chapters follow a programmer RPG story from bug to Code Core', () => {
    expect(javascriptBattles.map((battle) => battle.label)).toEqual([
      'CHAPTER 01',
      'CHAPTER 02',
      'FINAL CHAPTER',
    ])
    expect(javascriptBattles[0]?.title).toBe('最初のバグ')
    expect(javascriptBattles[1]?.title).toBe('広がるバグ')
    expect(javascriptBattles[2]).toMatchObject({
      title: '暴走するCode Core',
      isBoss: true,
    })
    expect(javascriptBattles[0]?.subtitle).toContain('新人Code Knight')
    expect(javascriptBattles[1]?.subtitle).toContain('ログ')
    expect(javascriptBattles[2]?.subtitle).toContain('共通処理')
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.name === 'Code Core')).toBe(true)
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.attackName === 'Runtime Cascade')).toBe(true)
  })

  it('uses programmer characters without incident-management jargon', () => {
    expect(npcById.archivist).toMatchObject({ name: 'LEAD ADA', role: 'SENIOR ENGINEER' })
    expect(npcById['lambda-sage']).toMatchObject({ name: 'LAMBDA', role: 'CODE MENTOR' })
    expect(npcById['byte-scout']).toMatchObject({ name: 'BYTE', role: 'DEBUGGER' })

    expect(javascriptQuest?.title).toBe('JavaScript王国のバグを追え')
    expect(javascriptQuest?.steps.map((step) => step.label)).toEqual([
      '戦闘システムのターゲットバグを直す',
      'ログを追い、複数の機能に広がるバグの共通コードを探す',
      '暴走したCode Coreを止め、王国のシステムを復旧する',
    ])
  })

  it('ends with the shared Code Core fixed and the system restored', () => {
    const adaEnding = npcById.archivist?.dialogues.find(
      (dialogue) => dialogue.id === 'archivist-area-clear',
    )
    const byteEnding = npcById['byte-scout']?.dialogues.find(
      (dialogue) => dialogue.id === 'byte-area-clear',
    )

    expect(adaEnding?.lines.join(' ')).toContain('Code Coreは安定した')
    expect(adaEnding?.lines.join(' ')).toContain('共通コード')
    expect(byteEnding?.lines.join(' ')).toContain('全部green')
  })

  it('shows the three chapters as simple story gates on the field', () => {
    const battleLabels = javascriptField.interactions
      .filter((interaction) => interaction.kind === 'battle')
      .map((interaction) => interaction.label)

    expect(battleLabels).toEqual([
      '最初のバグ',
      '広がるバグ',
      'CODE CORE',
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
