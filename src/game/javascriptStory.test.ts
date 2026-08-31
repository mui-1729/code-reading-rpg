import { describe, expect, it } from 'vitest'
import { npcById } from '../dialogue/npcs'
import { getBattleDisplayCode, getLevelForExp, getTotalExpForLevel } from '../progression'
import { mainQuests } from '../quests/quests'
import { JAVASCRIPT_AREA_ID } from './areas'
import { getBattlesForArea } from './areaProgression'

const javascriptBattles = getBattlesForArea(JAVASCRIPT_AREA_ID)
const battleByLegacyId = new Map(javascriptBattles.map((battle) => [battle.id, battle]))
const javascriptQuest = mainQuests.find((quest) => quest.areaId === JAVASCRIPT_AREA_ID)

describe('JavaScript story progression', () => {
  it('legacy numeric IDではなくsemantic Story順でJS-01〜JS-19を一続きに表示する', () => {
    expect(javascriptBattles.map((battle) => battle.id)).toEqual([
      1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3,
    ])
    expect(javascriptBattles.map((battle) => getBattleDisplayCode(battle.id))).toEqual(
      Array.from({ length: 19 }, (_, index) => `JS-${String(index + 1).padStart(2, '0')}`),
    )
    expect(javascriptBattles.map((battle) => battle.label.split(' · ')[0])).toEqual(
      Array.from({ length: 19 }, (_, index) => `JS-${String(index + 1).padStart(2, '0')}`),
    )
  })

  it('Opening後はTrainingより先にlive incidentを体験し、その不足を埋めるVillage preparationへ続く', () => {
    expect(javascriptBattles.slice(0, 4).map((battle) => battle.label)).toEqual([
      'JS-01 · LIVE INCIDENT',
      'JS-02 · INCIDENT PREP',
      'JS-03 · INCIDENT PREP',
      'JS-04 · INCIDENT PREP',
    ])
    expect(javascriptBattles[0]?.title).toBe('最初のtarget異常')
    expect(javascriptBattles[0]?.subtitle).toContain('まず現場で症状を再現')
    expect(javascriptBattles.slice(1, 4).map((battle) => battle.title)).toEqual([
      '数字を見比べる',
      '名前を見比べる',
      '前から最初の一体を探す',
    ])
    expect(javascriptBattles.slice(1, 4).every((battle) => battle.subtitle.includes('incident'))).toBe(true)
  })

  it('Training後は同じBattleへ戻らずForest trace→second symptom→Deep Forest root traceへ進む', () => {
    expect(javascriptBattles.slice(4, 9).map((battle) => battle.label)).toEqual([
      'JS-05 · FOREST TRACE',
      'JS-06 · FOREST TRACE',
      'JS-07 · TRACE JUNCTION',
      'JS-08 · TRACE BLOCKED',
      'JS-09 · IMPACT RANGE',
    ])
    expect(javascriptBattles[9]?.label).toBe('JS-10 · SECOND SYMPTOM')
    expect(javascriptBattles[9]?.title).toBe('広がるバグ')
    expect(javascriptBattles.slice(10, 18).every((battle) => battle.label.startsWith('JS-'))).toBe(true)
    expect(javascriptBattles[18]).toMatchObject({
      label: 'JS-19 · ROOT CAUSE',
      title: '暴走するCode Core',
      isBoss: true,
    })
  })

  it('syntax名をLEARNED表示する教材chapterではなくWorld event / traceとしてlabelする', () => {
    expect(javascriptBattles.every((battle) => !battle.label.includes('LEARNED'))).toBe(true)
    expect(battleByLegacyId.get(17)?.label).toContain('REAL-WORLD SIGNAL')
    expect(battleByLegacyId.get(18)?.label).toContain('BARRIER RULE')
    expect(battleByLegacyId.get(19)?.label).toContain('ROOT TRACE BLOCKED')
    expect(battleByLegacyId.get(22)?.label).toContain('FINAL TRACE')
  })

  it('uses programmer characters while the quest remains a bug investigation rather than a syllabus', () => {
    expect(npcById.archivist).toMatchObject({ name: 'LEAD ADA', role: 'mentor', roleLabel: 'SENIOR ENGINEER', visualId: 'lead-ada' })
    expect(npcById['lambda-sage']).toMatchObject({ name: 'LAMBDA', role: 'mentor', roleLabel: 'CODE MENTOR' })
    expect(npcById['byte-scout']).toMatchObject({ name: 'BYTE', role: 'scout', roleLabel: 'DEBUGGER', visualId: 'byte' })

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

  it('incident系Skillは後半の実incident / Finalでも既習syntaxを捨てずに積み上げる', () => {
    const firstIncident = new Set(battleByLegacyId.get(1)?.skillIds ?? [])
    const secondIncident = new Set(battleByLegacyId.get(2)?.skillIds ?? [])
    const final = new Set(battleByLegacyId.get(3)?.skillIds ?? [])

    for (const skillId of firstIncident) {
      expect(secondIncident.has(skillId), `${skillId} should remain in second incident`).toBe(true)
      expect(final.has(skillId), `${skillId} should remain in final`).toBe(true)
    }
    for (const skillId of secondIncident) {
      expect(final.has(skillId), `${skillId} should remain in final`).toBe(true)
    }
  })

  it('Story順の累積EXPはFinal推奨Lvを寄り道用stretch targetとして残し、clear後にLv5へ届く', () => {
    const firstIncidentExp = javascriptBattles[0]?.expReward ?? 0
    const throughForestExp = javascriptBattles
      .slice(0, 9)
      .reduce((total, battle) => total + battle.expReward, 0)
    const beforeFinalExp = javascriptBattles
      .slice(0, -1)
      .reduce((total, battle) => total + battle.expReward, 0)
    const finalReward = javascriptBattles.at(-1)?.expReward ?? 0
    const finalRecommendedLevel = battleByLegacyId.get(3)?.recommendedLevel ?? 1

    expect(getLevelForExp(0)).toBe(1)
    expect(getLevelForExp(firstIncidentExp)).toBe(1)
    expect(getLevelForExp(throughForestExp)).toBe(battleByLegacyId.get(2)?.recommendedLevel)
    expect(getLevelForExp(beforeFinalExp)).toBe(finalRecommendedLevel - 1)
    expect(getTotalExpForLevel(finalRecommendedLevel) - beforeFinalExp).toBe(100)
    expect(getLevelForExp(beforeFinalExp + finalReward)).toBe(finalRecommendedLevel)
  })
})
