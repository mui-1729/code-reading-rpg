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

export const equipmentVisuals: Record<string, string> = {
  'training-blade': '/pixel-art/equipment/weapons/training-blade.svg',
  'guard-edge': '/pixel-art/equipment/weapons/guard-edge.svg',
  'branch-saber': '/pixel-art/equipment/weapons/branch-saber.svg',
  'traveler-coat': '/pixel-art/equipment/armor/traveler-coat.svg',
  'vital-coat': '/pixel-art/equipment/armor/vital-coat.svg',
  'typed-mail': '/pixel-art/equipment/armor/typed-mail.svg',
  'debug-charm': '/pixel-art/equipment/accessories/debug-charm.svg',
  'life-charm': '/pixel-art/equipment/accessories/life-charm.svg',
}

export function getEquipmentVisual(equipmentId: string | null): string | null {
  if (!equipmentId) return null
  return equipmentVisuals[equipmentId] ?? null
}

/** Battle still renders only the equipped weapon, but the visual source is shared by every slot. */
export function getWeaponVisual(equipmentId: string | null): string | null {
  return getEquipmentVisual(equipmentId)
}
