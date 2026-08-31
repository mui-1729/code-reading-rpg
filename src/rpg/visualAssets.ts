export const characterVisuals = {
  player: {
    field: '/pixel-art/characters/code-knight-field.svg',
    battle: '/pixel-art/characters/code-knight-battle.svg',
  },
  byte: {
    field: '/pixel-art/characters/byte-field.svg',
    battle: '/pixel-art/characters/byte-battle.svg',
    portrait: '/pixel-art/characters/byte-field.svg',
  },
  leadAda: {
    portrait: '/pixel-art/characters/lead-ada-portrait.svg',
  },
  trainerMio: {
    field: '/pixel-art/characters/trainer-mio-field.svg',
    portrait: '/pixel-art/characters/trainer-mio-portrait.svg',
  },
  typeWarden: {
    portrait: '/pixel-art/characters/type-warden-portrait.svg',
  },
} as const

const storySpeakerPortraits: Readonly<Record<string, string>> = {
  byte: characterVisuals.byte.portrait,
  'lead-ada': characterVisuals.leadAda.portrait,
  'trainer-mio': characterVisuals.trainerMio.portrait,
  'type-warden': characterVisuals.typeWarden.portrait,
}

export function getStorySpeakerVisual(speakerId: string): string | null {
  return storySpeakerPortraits[speakerId] ?? null
}

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
