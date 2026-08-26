import type { FieldDefinition, FieldPosition } from './types'

const borderTiles = (width: number, height: number): FieldPosition[] => {
  const tiles: FieldPosition[] = []

  for (let x = 0; x < width; x += 1) {
    tiles.push({ x, y: 0 }, { x, y: height - 1 })
  }

  for (let y = 1; y < height - 1; y += 1) {
    tiles.push({ x: 0, y }, { x: width - 1, y })
  }

  return tiles
}

const width = 12
const height = 9

export const javascriptField: FieldDefinition = {
  id: 'javascript-kingdom-field',
  width,
  height,
  start: { x: 5, y: 7 },
  blockedTiles: [
    ...borderTiles(width, height),
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 7, y: 5 },
    { x: 8, y: 5 },
  ],
  interactions: [
    {
      id: 'stage-1-gate',
      kind: 'battle',
      stageId: 1,
      label: 'FIRST READ GATE',
      x: 2,
      y: 2,
    },
    {
      id: 'stage-2-gate',
      kind: 'battle',
      stageId: 2,
      label: 'ONE OR MANY GATE',
      x: 5,
      y: 2,
    },
    {
      id: 'stage-3-gate',
      kind: 'battle',
      stageId: 3,
      label: 'BOSS GATE',
      x: 9,
      y: 2,
    },
    {
      id: 'archivist-npc',
      kind: 'npc',
      npcId: 'archivist',
      x: 2,
      y: 6,
    },
    {
      id: 'lambda-sage-npc',
      kind: 'npc',
      npcId: 'lambda-sage',
      x: 8,
      y: 6,
    },
    {
      id: 'byte-scout-npc',
      kind: 'npc',
      npcId: 'byte-scout',
      x: 7,
      y: 3,
    },
    {
      id: 'field-sign',
      kind: 'sign',
      x: 5,
      y: 6,
      message: '矢印キー / WASDで移動。門・NPC・看板の手前でENTERまたはINTERACT。',
    },
    {
      id: 'find-sign',
      kind: 'sign',
      x: 2,
      y: 4,
      learningHintId: 'js-find',
    },
    {
      id: 'filter-sign',
      kind: 'sign',
      x: 5,
      y: 4,
      learningHintId: 'js-filter',
    },
    {
      id: 'comparison-sign',
      kind: 'sign',
      x: 6,
      y: 5,
      learningHintId: 'js-comparison',
    },
    {
      id: 'sort-sign',
      kind: 'sign',
      x: 9,
      y: 4,
      learningHintId: 'js-sort',
    },
    {
      id: 'stage-select-exit',
      kind: 'exit',
      label: 'STAGE SELECT',
      x: 10,
      y: 7,
    },
  ],
}
