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

function getWorldFeedbackHeading(feedback: WorldProgressFeedback): string {
  if (feedback.kind === 'bossUnlocked') return 'ボス解放'
  if (feedback.kind === 'complete') return '攻略完了'
  return '進行更新'
}

/** Domain fields choose result events; translated UI strings never act as discriminants. */
export function createVictoryResultSequence(
  reward: BattleVictoryReward,
  presentation: VictoryPresentation = {},
): ResultSequenceItem[] {
  const items: ResultSequenceItem[] = [
    { id: 'exp', title: '獲得EXP', detail: `+${reward.expGained}`, tone: 'reward' },
    { id: 'gold', title: '獲得ゴールド', detail: `+${reward.goldGained} G`, tone: 'reward' },
  ]
  if (!reward.firstClear) {
    items.push({ id: 'replay', title: '再クリア · EXP 100% / GOLD 50%', tone: 'clear' })
  }
  if (reward.newLevel > reward.previousLevel) {
    const maxHpDelta = getMaxHpForLevel(reward.newLevel) - getMaxHpForLevel(reward.previousLevel)
    const powerDelta = Math.round(
      (getPowerMultiplierForLevel(reward.newLevel) - getPowerMultiplierForLevel(reward.previousLevel)) * 100,
    )
    items.push({
      id: 'level',
      title: `レベルアップ！ · 最大HP +${maxHpDelta} · 威力 +${powerDelta}%`,
      detail: `${reward.previousLevel} → ${reward.newLevel}`,
      tone: 'level',
    })
  }
  if (reward.firstClear && !presentation.worldFeedback) {
    items.push({
      id: 'stage',
      title: 'ステージクリア',
      detail: reward.unlockedStageId
        ? `STAGE ${getBattleDisplayCode(reward.unlockedStageId)} 解放`
        : undefined,
      tone: 'clear',
    })
  }
  const unlockedSkillNames = getUnlockedSkillNames(reward, presentation)
  if (unlockedSkillNames.length > 0) {
    items.push({
      id: 'skill',
      title: 'スキル解放',
      detail: unlockedSkillNames.join(' / '),
      tone: 'unlock',
    })
  }
  if (reward.clearedAreaId) {
    const completion = presentation.worldFeedback?.kind === 'complete'
      ? [
          presentation.worldFeedback.label,
          presentation.worldFeedback.progressLabel,
          presentation.worldFeedback.next,
        ]
          .filter(Boolean)
          .join(' · ')
      : null
    items.push({
      id: 'area',
      title: 'エリアクリア',
      detail: [presentation.clearedAreaTitle ?? reward.clearedAreaId, completion]
        .filter(Boolean)
        .join(' · '),
      tone: 'clear',
    })
  }
  if (
    presentation.worldFeedback &&
    !(reward.clearedAreaId && presentation.worldFeedback.kind === 'complete')
  ) {
    const feedback = presentation.worldFeedback
    items.push({
      id: 'world-progress',
      title: getWorldFeedbackHeading(feedback),
      detail: [feedback.label, feedback.progressLabel, feedback.next && `次 → ${feedback.next}`]
        .filter(Boolean)
        .join(' · '),
      tone: feedback.kind === 'complete' ? 'clear' : 'progress',
    })
  }
  if (presentation.equipment) {
    items.push({
      id: 'equipment',
      title: '装備獲得',
      detail: presentation.equipment.name,
      tone: 'unlock',
      equipmentId: presentation.equipment.id,
    })
  }
  return items
}
