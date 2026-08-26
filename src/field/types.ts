export type Direction = 'up' | 'down' | 'left' | 'right'

export type FieldPosition = {
  x: number
  y: number
}

export type BattleEntrance = FieldPosition & {
  id: string
  kind: 'battle'
  stageId: number
  label: string
}

export type SignInteraction = FieldPosition & {
  id: string
  kind: 'sign'
  message: string
}

export type AreaExit = FieldPosition & {
  id: string
  kind: 'exit'
  label: string
}

export type FieldInteraction = BattleEntrance | SignInteraction | AreaExit

export type FieldDefinition = {
  id: string
  width: number
  height: number
  start: FieldPosition
  blockedTiles: FieldPosition[]
  interactions: FieldInteraction[]
}
