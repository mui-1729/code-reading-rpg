import { describe, expect, it } from 'vitest'
import { restorePlayerProgress } from './storage'

function storedProgress(
  clearedStageIds: number[],
  unlockedStageIds: number[] = [1, 4, 7, 8, 9],
  unlockedSkillIds: string[] = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
) {
  return JSON.stringify({
    version: 4,
    progress: {
      exp: 24,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds,
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds,
      unlockedSkillIds,
    },
  })
}

describe('Forest progression save normalization', () => {
  it('#203時点でBattle 9までclearしたv4 saveは最初のincident 1へ進む', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9]))
    expect(restored.unlockedStageIds).toContain(1)
    expect(restored.unlockedStageIds).not.toContain(10)
  })

  it('Battle 10 clear済みsaveへBattle 11とLINK unlockを補い、通過済みincident 1も履歴化する', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10]))
    expect(restored.clearedStageIds).toContain(1)
    expect(restored.unlockedStageIds).toContain(11)
    expect(restored.unlockedSkillIds).toContain('link')
  })

  it('Battle 11 clear済みsaveへBattle 12とFORK unlockを補う', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10, 11]))
    expect(restored.unlockedStageIds).toContain(12)
    expect(restored.unlockedSkillIds).toContain('fork')
  })

  it('#205時点でBattle 12までclearしたv4 saveへBattle 13 unlockを補う', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10, 11, 12]))
    expect(restored.unlockedStageIds).toContain(13)
    expect(restored.unlockedSkillIds).toContain('link')
    expect(restored.unlockedSkillIds).toContain('fork')
  })

  it('#207時点でBattle 13までclearしたv4 saveへBattle 14 unlockを補う', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10, 11, 12, 13]))
    expect(restored.unlockedStageIds).toContain(14)
    expect(restored.unlockedSkillIds).not.toContain('gather')
  })

  it('#209時点でBattle 14までclearしたv4 saveは二つ目のincident 2へ進みGATHERを復元する', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10, 11, 12, 13, 14]))
    expect(restored.unlockedStageIds).toContain(2)
    expect(restored.unlockedStageIds).not.toContain(15)
    expect(restored.unlockedSkillIds).toContain('gather')
    expect(restored.unlockedSkillIds).not.toContain('echo')
  })

  it('#214時点でBattle 15までclearしたv4 saveへBattle 16とECHO unlockを補いincident 2も履歴化する', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10, 11, 12, 13, 14, 15]))
    expect(restored.clearedStageIds).toContain(2)
    expect(restored.unlockedStageIds).toContain(16)
    expect(restored.unlockedSkillIds).toContain('echo')
    expect(restored.unlockedSkillIds).not.toContain('project')
  })

  it('Battle 16〜18 clear済みsaveは次Lessonとmap/some/every Skillを復元する', () => {
    const restored = restorePlayerProgress(
      storedProgress([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
    )

    expect(restored.unlockedStageIds).toContain(19)
    expect(restored.unlockedSkillIds).toEqual(
      expect.arrayContaining(['project', 'signal', 'sync']),
    )
  })

  it('Battle 19〜21 clear済みsaveは最深部Lesson 20〜22を復元する', () => {
    const restored = restorePlayerProgress(
      storedProgress([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]),
    )

    expect(restored.unlockedStageIds).toEqual(expect.arrayContaining([20, 21, 22]))
    expect(restored.unlockedSkillIds).toEqual(
      expect.arrayContaining(['order', 'safe-path']),
    )
    expect(restored.unlockedSkillIds).not.toContain('reduce-focus')
  })

  it('Battle 22 clear済みsaveはREDUCE FOCUSまで復元する', () => {
    const restored = restorePlayerProgress(
      storedProgress([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),
    )

    expect(restored.unlockedSkillIds).toContain('reduce-focus')
  })
})
