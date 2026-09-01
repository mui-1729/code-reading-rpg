export type DialogueProgress = {
  level: number
  clearedStageIds: number[]
  clearedAreaIds: string[]
}

export type DialogueCondition =
  | { kind: 'always' }
  | { kind: 'minLevel'; level: number }
  | { kind: 'stageCleared'; stageId: number }
  | { kind: 'areaCleared'; areaId: string }

export type DialogueEntry = {
  id: string
  condition: DialogueCondition
  lines: string[]
}

export type NpcDefinition = {
  id: string
  name: string
  role: 'mentor' | 'scout' | 'maintainer' | 'resident'
  roleLabel: string
  visualId: string | null
  dialogues: DialogueEntry[]
}
