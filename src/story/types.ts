export type StoryWorldLayer = 'real-world' | 'connect' | 'code-world' | 'remote' | 'return'

export type BattleStoryLine = {
  speaker: string
  role: string
  text: string
  layer?: StoryWorldLayer
}

export type BattleStoryEvent = {
  id: string
  label: string
  title: string
  lines: BattleStoryLine[]
}
