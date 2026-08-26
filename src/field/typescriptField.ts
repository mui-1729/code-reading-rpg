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

export const typescriptField: FieldDefinition = {
  id: 'typescript-frontier-field',
  width,
  height,
  start: { x: 5, y: 7 },
  // Interactable objects are solid tiles. Keep the interior floor open so every Gate,
  // learning sign, and NPC always has a reachable adjacent interaction tile.
  blockedTiles: borderTiles(width, height),
  interactions: [
    {
      id: 'ts-stage-4-gate',
      kind: 'battle',
      stageId: 4,
      label: 'TYPED ENTRY GATE',
      x: 2,
      y: 2,
    },
    {
      id: 'ts-stage-5-gate',
      kind: 'battle',
      stageId: 5,
      label: 'MAYBE VALUE GATE',
      x: 5,
      y: 2,
    },
    {
      id: 'ts-stage-6-gate',
      kind: 'battle',
      stageId: 6,
      label: 'COMPILER BOSS GATE',
      x: 9,
      y: 2,
    },
    {
      id: 'type-warden-npc',
      kind: 'npc',
      npcId: 'type-warden',
      x: 2,
      y: 7,
    },
    {
      id: 'narrowing-scholar-npc',
      kind: 'npc',
      npcId: 'narrowing-scholar',
      x: 8,
      y: 7,
    },
    {
      id: 'compiler-scout-npc',
      kind: 'npc',
      npcId: 'compiler-scout',
      x: 7,
      y: 3,
    },
    {
      id: 'ts-function-sign',
      kind: 'sign',
      x: 3,
      y: 6,
      learningHintId: 'ts-function-signature',
    },
    {
      id: 'ts-array-sign',
      kind: 'sign',
      x: 5,
      y: 6,
      learningHintId: 'ts-array-type',
    },
    {
      id: 'ts-literal-sign',
      kind: 'sign',
      x: 9,
      y: 6,
      learningHintId: 'ts-string-literal',
    },
    {
      id: 'ts-type-sign',
      kind: 'sign',
      x: 2,
      y: 5,
      learningHintId: 'ts-type-annotation',
    },
    {
      id: 'ts-union-sign',
      kind: 'sign',
      x: 4,
      y: 5,
      learningHintId: 'ts-union',
    },
    {
      id: 'ts-optional-sign',
      kind: 'sign',
      x: 6,
      y: 5,
      learningHintId: 'ts-optional',
    },
    {
      id: 'ts-narrowing-sign',
      kind: 'sign',
      x: 8,
      y: 5,
      learningHintId: 'ts-narrowing',
    },
    {
      id: 'ts-keyof-sign',
      kind: 'sign',
      x: 10,
      y: 5,
      learningHintId: 'ts-keyof',
    },
    {
      id: 'typescript-stage-select-exit',
      kind: 'exit',
      label: 'STAGE SELECT',
      x: 10,
      y: 7,
    },
  ],
}
