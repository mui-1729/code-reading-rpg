import { describe, expect, it } from 'vitest'
import { applyBattleVictory, createInitialPlayerProgress } from '../progression/progression'
import { getMasteredSkillIds } from '../progression/skillMastery'
import { createVictoryResultSequence } from './resultSequence'

const beforeFilterLesson = [1, 7, 8, 9, 10, 11, 12, 13]

function createProgressBeforeFilterLesson() {
  return {
    ...createInitialPlayerProgress(),
    clearedStageIds: beforeFilterLesson,
    unlockedStageIds: [...beforeFilterLesson, 14],
    unlockedSkillIds: getMasteredSkillIds(beforeFilterLesson),
  }
}

describe('victory mastery reward summary', () => {
  it('reports every Skill that becomes MASTERED from one clear', () => {
    const result = applyBattleVictory(createProgressBeforeFilterLesson(), {
      stageId: 14,
      expReward: 28,
      goldReward: 12,
    })

    expect(result.reward.unlockedSkillIds).toEqual(['gather', 'viper', 'lock', 'alert'])
    expect(result.reward.unlockedSkillId).toBe('gather')
    expect(result.progress.unlockedSkillIds).toEqual(
      expect.arrayContaining(['gather', 'viper', 'lock', 'alert']),
    )
  })

  it('shows the same newly MASTERED set in the visible result event', () => {
    const result = applyBattleVictory(createProgressBeforeFilterLesson(), {
      stageId: 14,
      expReward: 28,
      goldReward: 12,
    })

    expect(createVictoryResultSequence(result.reward).find((item) => item.id === 'skill')).toEqual({
      id: 'skill',
      title: 'スキル解放',
      detail: 'GATHER / VIPER / LOCK / ALERT',
      tone: 'unlock',
    })
  })

  it('does not announce mastery again on replay', () => {
    const first = applyBattleVictory(createProgressBeforeFilterLesson(), {
      stageId: 14,
      expReward: 28,
      goldReward: 12,
    })
    const replay = applyBattleVictory(first.progress, {
      stageId: 14,
      expReward: 28,
      goldReward: 12,
    })

    expect(replay.reward.unlockedSkillIds).toBeUndefined()
    expect(replay.reward.unlockedSkillId).toBeUndefined()
    expect(createVictoryResultSequence(replay.reward).some((item) => item.id === 'skill')).toBe(false)
  })
})
