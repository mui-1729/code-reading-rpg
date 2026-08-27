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
  it('3 chapters form one simple kingdom adventure', () => {
    expect(javascriptBattles.map((battle) => battle.label)).toEqual([
      'CHAPTER 01',
      'CHAPTER 02',
      'FINAL CHAPTER',
    ])
    expect(javascriptBattles[0]?.title).toBe('草原の異変')
    expect(javascriptBattles[1]?.title).toBe('広がる暴走')
    expect(javascriptBattles[2]).toMatchObject({
      title: '黒幕の城',
      isBoss: true,
    })
    expect(javascriptBattles[0]?.subtitle).toContain('西の草原')
    expect(javascriptBattles[1]?.subtitle).toContain('黒い結晶')
    expect(javascriptBattles[2]?.subtitle).toContain('Code Crystal')
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.name === 'Boss')).toBe(true)
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.attackName === 'Dark Cascade')).toBe(true)
  })

  it('uses fantasy roles and a clear save-the-kingdom quest', () => {
    expect(npcById.archivist).toMatchObject({ name: 'CAPTAIN ADA', role: 'ROYAL GUARD' })
    expect(npcById['lambda-sage']).toMatchObject({ name: 'SAGE LAMBDA', role: 'COURT SCHOLAR' })
    expect(npcById['byte-scout']).toMatchObject({ name: 'BYTE', role: 'SCOUT' })

    expect(javascriptQuest?.title).toBe('JavaScript王国を救え')
    expect(javascriptQuest?.steps.map((step) => step.label)).toEqual([
      '西の草原の魔物を倒し、異変の手がかりを見つける',
      '暴走する魔物を退け、黒い結晶の痕跡を西の砦まで追う',
      '西の砦のBossを倒し、Code Crystalを取り戻す',
    ])
  })

  it('ends with the kingdom restored after the boss is defeated', () => {
    const adaEnding = npcById.archivist?.dialogues.find(
      (dialogue) => dialogue.id === 'archivist-area-clear',
    )
    const byteEnding = npcById['byte-scout']?.dialogues.find(
      (dialogue) => dialogue.id === 'byte-area-clear',
    )

    expect(adaEnding?.lines.join(' ')).toContain('Code Crystalの光が戻った')
    expect(adaEnding?.lines.join(' ')).toContain('JavaScript王国は救われた')
    expect(byteEnding?.lines.join(' ')).toContain('全部元通り')
  })

  it('shows the three chapters as story locations on the field', () => {
    const battleLabels = javascriptField.interactions
      .filter((interaction) => interaction.kind === 'battle')
      .map((interaction) => interaction.label)

    expect(battleLabels).toEqual([
      '草原の異変',
      '広がる暴走',
      '西の砦',
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
