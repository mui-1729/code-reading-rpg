export type BattleStoryLine = {
  speaker: string
  role: string
  text: string
}

export type BattleStoryEvent = {
  id: string
  label: string
  title: string
  lines: BattleStoryLine[]
}
