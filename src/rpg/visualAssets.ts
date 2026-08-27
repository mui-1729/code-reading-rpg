export const characterVisuals = {
  player: {
    field: '/pixel-art/characters/code-knight-field.svg',
    battle: '/pixel-art/characters/code-knight-battle.svg',
  },
  byte: {
    field: '/pixel-art/characters/byte-field.svg',
    battle: '/pixel-art/characters/byte-battle.svg',
  },
} as const

export const weaponVisuals: Record<string, string> = {
  'training-blade': '/pixel-art/weapons/training-blade.svg',
  'guard-edge': '/pixel-art/weapons/guard-edge.svg',
  'branch-saber': '/pixel-art/weapons/branch-saber.svg',
}

export function getWeaponVisual(equipmentId: string | null): string | null {
  if (!equipmentId) return null
  return weaponVisuals[equipmentId] ?? null
}
