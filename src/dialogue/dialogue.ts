import type { DialogueCondition, DialogueEntry, DialogueProgress, NpcDefinition } from './types'

export function matchesDialogueCondition(
  condition: DialogueCondition,
  progress: DialogueProgress,
): boolean {
  switch (condition.kind) {
    case 'always':
      return true
    case 'minLevel':
      return progress.level >= condition.level
    case 'stageCleared':
      return progress.clearedStageIds.includes(condition.stageId)
    case 'areaCleared':
      return progress.clearedAreaIds.includes(condition.areaId)
  }
}

export function getDialogueForNpc(
  npc: NpcDefinition,
  progress: DialogueProgress,
): DialogueEntry {
  const dialogue = npc.dialogues.find((entry) => matchesDialogueCondition(entry.condition, progress))
  if (!dialogue) {
    throw new Error(`NPC ${npc.id} has no matching dialogue`)
  }
  return dialogue
}
