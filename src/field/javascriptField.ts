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
  // Interactable objects are already solid tiles. Keep the interior floor open so the
  // player always has a visible route from the entrance toward the three Battle Gates.
  blockedTiles: borderTiles(width, height),
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
      id: 'find-sign',
      kind: 'sign',
      x: 2,
      y: 4,
      learningHintId: 'js-find',
    },
    {
      id: 'filter-sign',
      kind: 'sign',
      x: 4,
      y: 4,
      learningHintId: 'js-filter',
    },
    {
      id: 'map-sign',
      kind: 'sign',
      x: 1,
      y: 5,
      learningHintId: 'js-map',
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
      id: 'and-sign',
      kind: 'sign',
      x: 3,
      y: 6,
      learningHintId: 'js-and',
    },
    {
      id: 'or-sign',
      kind: 'sign',
      x: 4,
      y: 6,
      learningHintId: 'js-or',
    },
    {
      id: 'some-sign',
      kind: 'sign',
      x: 9,
      y: 6,
      learningHintId: 'js-some',
    },
    {
      id: 'reduce-sign',
      kind: 'sign',
      x: 10,
      y: 5,
      learningHintId: 'js-reduce',
    },
    {
      id: 'world-map-exit',
      kind: 'exit',
      label: 'WORLD MAP',
      x: 10,
      y: 7,
    },
  ],
}
