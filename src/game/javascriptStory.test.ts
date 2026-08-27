import { describe, expect, it } from 'vitest'
import { npcById } from '../dialogue/npcs'
import { getLevelForExp } from '../progression'
import { mainQuests } from '../quests/quests'
import { JAVASCRIPT_AREA_ID } from './areas'
import { battles } from './battles'

const javascriptBattles = battles.filter((battle) => battle.areaId === JAVASCRIPT_AREA_ID)
const javascriptQuest = mainQuests.find((quest) => quest.areaId === JAVASCRIPT_AREA_ID)

describe('JavaScript story progression', () => {
  it('3 chapters grow from a first bug fix into a production incident', () => {
    expect(javascriptBattles.map((battle) => battle.label)).toEqual([
      'CHAPTER 01',
      'CHAPTER 02',
      'FINAL CHAPTER',
    ])
    expect(javascriptBattles[0]?.title).toBe('Your First Bug Fix')
    expect(javascriptBattles[1]?.title).toBe('Bug Reports Keep Coming')
    expect(javascriptBattles[2]).toMatchObject({
      title: 'Production Incident',
      isBoss: true,
    })
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.name === 'Boss')).toBe(true)
    expect(javascriptBattles[2]?.enemies.some((enemy) => enemy.attackName === 'Runtime Collapse')).toBe(true)
  })

  it('uses engineering roles and an issue-to-incident quest flow', () => {
    expect(npcById.archivist).toMatchObject({ name: 'LEAD ADA', role: 'SENIOR ENGINEER' })
    expect(npcById['lambda-sage']).toMatchObject({ name: 'REVIEWER LAMBDA', role: 'CODE REVIEWER' })
    expect(npcById['byte-scout']).toMatchObject({ name: 'BYTE', role: 'QA ENGINEER' })

    expect(javascriptQuest?.title).toBe('新人エンジニアの初仕事')
    expect(javascriptQuest?.steps.map((step) => step.label)).toEqual([
      '最初のissueを調査してbugの原因を特定する',
      '追加bug reportの影響範囲を調査する',
      'Production Incidentを解決してサービスを復旧する',
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
