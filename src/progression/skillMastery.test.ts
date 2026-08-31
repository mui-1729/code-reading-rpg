import { describe, expect, it } from 'vitest'
import {
  getBattleStartMasteredSkillIds,
  getBattleTrialSkillIds,
  getMasteredSkillIds,
  getSkillUnlocksForStage,
  INITIAL_MASTERED_SKILL_IDS,
  isSkillAvailableForBattle,
} from './skillMastery'

const throughImpactRange = [1, 7, 8, 9, 10, 11, 12, 13, 14]
const throughFinalTrace = [
  ...throughImpactRange,
  2,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
]

describe('skill mastery progression', () => {
  it('fresh progress starts with only the three JavaScript starter skills mastered', () => {
    expect(getMasteredSkillIds([])).toEqual([...INITIAL_MASTERED_SKILL_IDS])
  })

  it('derived combat variants wait until all of their reused syntax has been learned', () => {
    expect(getSkillUnlocksForStage(10)).toEqual(['link'])
    expect(getSkillUnlocksForStage(11)).toEqual(['fork'])
    expect(getSkillUnlocksForStage(14)).toEqual(['gather', 'viper', 'lock', 'alert'])
    expect(getSkillUnlocksForStage(17)).toEqual(['signal', 'sweep'])
    expect(getSkillUnlocksForStage(20)).toEqual(['order', 'moon-edge'])
    expect(getSkillUnlocksForStage(22)).toEqual(['reduce-focus', 'judge'])
  })

  it('forged isolated clear bits do not grant mastery without transitive prerequisites', () => {
    expect(getMasteredSkillIds([14])).toEqual([...INITIAL_MASTERED_SKILL_IDS])
    expect(getMasteredSkillIds([22])).toEqual([...INITIAL_MASTERED_SKILL_IDS])
  })

  it('the second incident starts with the Forest concepts and their valid variants already mastered', () => {
    const mastered = getBattleStartMasteredSkillIds(2)

    expect(mastered).toEqual(expect.arrayContaining([
      'trace',
      'pulse',
      'nova',
      'link',
      'lock',
      'fork',
      'alert',
      'gather',
      'viper',
    ]))
    expect(mastered).not.toContain('echo')
  })

  it('new lesson skills are available as a narrow trial before persistent mastery', () => {
    expect(getBattleTrialSkillIds(10)).toEqual(['link'])
    expect(isSkillAvailableForBattle(10, 'link')).toBe(true)
    expect(isSkillAvailableForBattle(10, 'lock')).toBe(false)
    expect(isSkillAvailableForBattle(10, 'fork')).toBe(false)

    expect(getBattleTrialSkillIds(14)).toEqual(['gather'])
    expect(isSkillAvailableForBattle(14, 'gather')).toBe(true)
    expect(isSkillAvailableForBattle(14, 'viper')).toBe(false)

    expect(getBattleTrialSkillIds(15)).toEqual(['echo'])
    expect(isSkillAvailableForBattle(15, 'echo')).toBe(true)
    expect(isSkillAvailableForBattle(15, 'project')).toBe(false)
  })

  it('the JavaScript Final starts with every prior Final loadout skill mastered', () => {
    const mastered = getBattleStartMasteredSkillIds(3)

    expect(mastered).toEqual(expect.arrayContaining([
      'viper',
      'lock',
      'alert',
      'moon-edge',
      'sweep',
      'judge',
    ]))
    expect(getMasteredSkillIds(throughFinalTrace)).toEqual(expect.arrayContaining(mastered))
  })

  it('TypeScript lessons expose their new toolkit as trial, then later Battles inherit it', () => {
    expect(getBattleTrialSkillIds(4)).toEqual(['ts-scan', 'ts-guard', 'ts-label'])
    expect(getBattleTrialSkillIds(5)).toEqual(['ts-union', 'ts-optional'])
    expect(getBattleTrialSkillIds(6)).toEqual(['ts-narrow', 'ts-keyof'])

    const beforeTs02 = getBattleStartMasteredSkillIds(5)
    expect(beforeTs02).toEqual(expect.arrayContaining(['ts-scan', 'ts-guard', 'ts-label']))
    expect(beforeTs02).not.toContain('ts-union')
  })

  it('valid canonical clears derive the expected mastered toolkit', () => {
    const mastered = getMasteredSkillIds(throughImpactRange)
    expect(mastered).toEqual(expect.arrayContaining([
      'link',
      'lock',
      'fork',
      'alert',
      'gather',
      'viper',
    ]))
  })
})
