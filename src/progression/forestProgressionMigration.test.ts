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
  it('#203時点でBattle 9までclearしたv4 saveへBattle 10 unlockを補う', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9]))

    expect(restored.unlockedStageIds).toContain(10)
  })

  it('Battle 10 clear済みsaveへBattle 11とLINK unlockを補う', () => {
    const restored = restorePlayerProgress(storedProgress([7, 8, 9, 10]))

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
})
