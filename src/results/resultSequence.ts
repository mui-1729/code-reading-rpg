import { allSkillDefinitionById } from '../game/skills'
import { getMaxHpForLevel, getPowerMultiplierForLevel } from '../progression/progression'
import { getBattleDisplayCode } from '../progression/progressionGraph'
import type { BattleVictoryReward } from '../progression/types'
import type { WorldProgressFeedback } from '../world/worldObjective'

export type ResultSequenceTone = 'reward' | 'level' | 'unlock' | 'clear' | 'progress'

export type ResultSequenceItem = {
  id: string
  title: string
  detail?: string
  tone: ResultSequenceTone
  equipmentId?: string
}

type VictoryPresentation = {
  unlockedSkillName?: string
  clearedAreaTitle?: string
  worldFeedback?: WorldProgressFeedback | null
  equipment?: { id: string; name: string }
}

function getUnlockedSkillIds(reward: BattleVictoryReward): string[] {
  if (reward.unlockedSkillIds) return reward.unlockedSkillIds
  return reward.unlockedSkillId ? [reward.unlockedSkillId] : []
}

function getUnlockedSkillNames(
  reward: BattleVictoryReward,
  presentation: VictoryPresentation,
): string[] {
  return getUnlockedSkillIds(reward).map((skillId, index) =>
    index === 0 && presentation.unlockedSkillName
      ? presentation.unlockedSkillName
      : allSkillDefinitionById[skillId]?.name ?? skillId,
  )
}

/** Domain fields choose result events; translated UI strings never act as discriminants. */
export function createVictoryResultSequence(
  reward: BattleVictoryReward,
  presentation: VictoryPresentation = {},
): ResultSequenceItem[] {
  const items: ResultSequenceItem[] = [
    { id: 'exp', title: 'EXP GAINED', detail: `+${reward.expGained}`, tone: 'reward' },
    { id: 'gold', title: 'GOLD GAINED', detail: `+${reward.goldGained} G`, tone: 'reward' },
  ]
  if (!reward.firstClear) {
    items.push({ id: 'replay', title: 'REPLAY CLEAR · EXP 100% / GOLD 50%', tone: 'clear' })
  }
  if (reward.newLevel > reward.previousLevel) {
    const maxHpDelta = getMaxHpForLevel(reward.newLevel) - getMaxHpForLevel(reward.previousLevel)
    const powerDelta = Math.round(
      (getPowerMultiplierForLevel(reward.newLevel) - getPowerMultiplierForLevel(reward.previousLevel)) * 100,
    )
    items.push({
      id: 'level',
      title: `LEVEL UP! · MAX HP +${maxHpDelta} · POWER +${powerDelta}%`,
      detail: `${reward.previousLevel} → ${reward.newLevel}`,
      tone: 'level',
    })
  }
  if (reward.firstClear && !presentation.worldFeedback) {
    items.push({
      id: 'stage',
      title: 'STAGE CLEAR',
      detail: reward.unlockedStageId ? `STAGE ${getBattleDisplayCode(reward.unlockedStageId)} UNLOCKED` : undefined,
      tone: 'clear',
    })
  }
  const unlockedSkillNames = getUnlockedSkillNames(reward, presentation)
  if (unlockedSkillNames.length > 0) {
    items.push({
      id: 'skill',
      title: unlockedSkillNames.length > 1 ? 'SKILLS UNLOCKED' : 'SKILL UNLOCKED',
      detail: unlockedSkillNames.join(' / '),
      tone: 'unlock',
    })
  }
  if (reward.clearedAreaId) {
    const completion = presentation.worldFeedback?.kind === 'complete'
      ? [presentation.worldFeedback.label, presentation.worldFeedback.progressLabel, presentation.worldFeedback.next].filter(Boolean).join(' · ')
      : null
    items.push({ id: 'area', title: 'AREA CLEAR', detail: [presentation.clearedAreaTitle ?? reward.clearedAreaId, completion].filter(Boolean).join(' · '), tone: 'clear' })
  }
  if (presentation.worldFeedback && !(reward.clearedAreaId && presentation.worldFeedback.kind === 'complete')) {
    const feedback = presentation.worldFeedback
    items.push({
      id: 'world-progress',
      title: feedback.heading,
      detail: [feedback.label, feedback.progressLabel, feedback.next && `NEXT → ${feedback.next}`].filter(Boolean).join(' · '),
      tone: feedback.kind === 'complete' ? 'clear' : 'progress',
    })
  }
  if (presentation.equipment) {
    items.push({ id: 'equipment', title: 'EQUIPMENT ACQUIRED', detail: presentation.equipment.name, tone: 'unlock', equipmentId: presentation.equipment.id })
  }
  return items
}
