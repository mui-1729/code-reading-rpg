export type EquipmentSlot = 'weapon' | 'armor' | 'accessory'

export type EquipmentBonuses = {
  maxHp?: number
  attack?: number
  defense?: number
  patchKitHeal?: number
}

export type EquipmentDefinition = {
  id: string
  name: string
  slot: EquipmentSlot
  description: string
  bonuses: EquipmentBonuses
}

export type EquipmentLoadout = Record<EquipmentSlot, string | null>

export const EMPTY_EQUIPMENT: EquipmentLoadout = {
  weapon: null,
  armor: null,
  accessory: null,
}

export const equipmentDefinitions: readonly EquipmentDefinition[] = [
  {
    id: 'training-blade',
    name: 'Training Blade',
    slot: 'weapon',
    description: '安定した練習剣。素直にAttackを伸ばす。',
    bonuses: { attack: 3 },
  },
  {
    id: 'branch-saber',
    name: 'Branch Saber',
    slot: 'weapon',
    description: '高Attack特化。威力と引き換えにDefenseが少し下がる。',
    bonuses: { attack: 7, defense: -1 },
  },
  {
    id: 'guard-blade',
    name: 'Guard Blade',
    slot: 'weapon',
    description: '守り寄りの剣。Attackを抑えてDefenseも補う。',
    bonuses: { attack: 1, defense: 2 },
  },
  {
    id: 'traveler-coat',
    name: 'Traveler Coat',
    slot: 'armor',
    description: 'HPとDefenseをバランスよく補う探索者用の上着。',
    bonuses: { maxHp: 8, defense: 3 },
  },
  {
    id: 'typed-mail',
    name: 'Typed Mail',
    slot: 'armor',
    description: 'Defense特化。最大HPより被Damage軽減を優先する。',
    bonuses: { maxHp: 4, defense: 7 },
  },
  {
    id: 'vital-jacket',
    name: 'Vital Jacket',
    slot: 'armor',
    description: '最大HP特化。Defenseより長いHPバーを選ぶ装備。',
    bonuses: { maxHp: 18, defense: 1 },
  },
  {
    id: 'debug-charm',
    name: 'Debug Charm',
    slot: 'accessory',
    description: 'AttackとDefenseを少しずつ補う小さな護符。',
    bonuses: { attack: 2, defense: 1 },
  },
  {
    id: 'patch-loop',
    name: 'Patch Loop',
    slot: 'accessory',
    description: 'PATCH KITの回復量を増やすBattle補助アクセサリ。',
    bonuses: { patchKitHeal: 12 },
  },
]

export const starterEquipmentIds = ['training-blade', 'traveler-coat'] as const

export const equipmentById: Record<string, EquipmentDefinition> = Object.fromEntries(
  equipmentDefinitions.map((item) => [item.id, item]),
)

export function getEquipmentBonuses(loadout: EquipmentLoadout): Required<EquipmentBonuses> {
  return (Object.values(loadout) as Array<string | null>).reduce(
    (total, equipmentId) => {
      const item = equipmentId ? equipmentById[equipmentId] : undefined
      if (!item) return total
      return {
        maxHp: total.maxHp + (item.bonuses.maxHp ?? 0),
        attack: total.attack + (item.bonuses.attack ?? 0),
        defense: total.defense + (item.bonuses.defense ?? 0),
        patchKitHeal: total.patchKitHeal + (item.bonuses.patchKitHeal ?? 0),
      }
    },
    { maxHp: 0, attack: 0, defense: 0, patchKitHeal: 0 },
  )
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`

export function getEquipmentEffectText(item: EquipmentDefinition): string {
  const effects: string[] = []
  if (item.bonuses.attack) effects.push(`ATK ${signed(item.bonuses.attack)}`)
  if (item.bonuses.defense) effects.push(`DEF ${signed(item.bonuses.defense)}`)
  if (item.bonuses.maxHp) effects.push(`HP ${signed(item.bonuses.maxHp)}`)
  if (item.bonuses.patchKitHeal) {
    effects.push(`PATCH KIT ${signed(item.bonuses.patchKitHeal)} HP`)
  }
  return effects.join(' · ')
}

export function equipItem(
  loadout: EquipmentLoadout,
  equipmentId: string,
): EquipmentLoadout {
  const item = equipmentById[equipmentId]
  if (!item) return loadout
  return { ...loadout, [item.slot]: item.id }
}
