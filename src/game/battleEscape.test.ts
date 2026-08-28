import { describe, expect, it } from 'vitest'
import { isBattleEscapeAllowed } from './battleEscape'

describe('battle escape policy', () => {
  it('Overworld Random Encounterは逃走できる', () => {
    expect(
      isBattleEscapeAllowed({
        battleId: 1,
        seed: 'encounter:5:10:11',
        returnTo: '/world',
        clearedStageIds: [],
      }),
    ).toBe(true)
  })

  it('local mapのclear済みRandom復習Battleは逃走できる', () => {
    expect(
      isBattleEscapeAllowed({
        battleId: 10,
        seed: 'encounter:js-forest:7:20:9',
        returnTo: '/world',
        clearedStageIds: [10],
      }),
    ).toBe(true)
  })

  it('初回fixed Lesson / Training / Boss / Mid-Bossは逃走できない', () => {
    expect(
      isBattleEscapeAllowed({
        battleId: 10,
        seed: 'encounter:js-forest:7:20:9',
        returnTo: '/world',
        clearedStageIds: [],
      }),
    ).toBe(false)
    expect(
      isBattleEscapeAllowed({
        battleId: 7,
        seed: 'village-training:7',
        returnTo: '/world',
        clearedStageIds: [],
      }),
    ).toBe(false)
    expect(
      isBattleEscapeAllowed({
        battleId: 13,
        seed: 'midboss:js-forest:1',
        returnTo: '/world',
        clearedStageIds: [],
      }),
    ).toBe(false)
    expect(
      isBattleEscapeAllowed({
        battleId: 3,
        seed: 'boss:js:1',
        returnTo: '/world',
        clearedStageIds: [1, 2, 22],
      }),
    ).toBe(false)
  })

  it('直接URLやreturnToなしのBattleでは逃走を出さない', () => {
    expect(
      isBattleEscapeAllowed({
        battleId: 1,
        seed: 'manual-seed',
        returnTo: null,
        clearedStageIds: [],
      }),
    ).toBe(false)
  })
})
