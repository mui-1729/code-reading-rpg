export type EquipmentSlot = 'weapon' | 'armor' | 'accessory'

export type EquipmentBonuses = {
  maxHp?: number
  attack?: number
  defense?: number
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
    description: 'Attackを少し伸ばしつつDefenseも補う安定型。',
    bonuses: { attack: 3, defense: 2 },
  },
  {
    id: 'branch-saber',
    name: 'Branch Saber',
    slot: 'weapon',
    description: '防御補助を持たずAttackへ大きく寄せた攻撃型。',
    bonuses: { attack: 7 },
  },
  {
    id: 'traveler-coat',
    name: 'Traveler Coat',
    slot: 'armor',
    description: 'DefenseよりMax HPを優先する探索向けの上着。',
    bonuses: { maxHp: 18, defense: 1 },
  },
  {
    id: 'typed-mail',
    name: 'Typed Mail',
    slot: 'armor',
    description: 'Max HPよりDefenseを優先して被Damageを抑える軽装。',
    bonuses: { maxHp: 6, defense: 5 },
  },
  {
    id: 'debug-charm',
    name: 'Debug Charm',
    slot: 'accessory',
    description: 'Attackを中心にDefenseも少し補う攻撃寄りの護符。',
    bonuses: { attack: 2, defense: 1 },
  },
  {
    id: 'safety-charm',
    name: 'Safety Charm',
    slot: 'accessory',
    description: 'Attackを伸ばさずMax HPとDefenseを補う防御寄りの護符。',
    bonuses: { maxHp: 12, defense: 2 },
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
      }
    },
    { maxHp: 0, attack: 0, defense: 0 },
  )
}

export function equipItem(
  loadout: EquipmentLoadout,
  equipmentId: string,
): EquipmentLoadout {
  const item = equipmentById[equipmentId]
  if (!item) return loadout
  return { ...loadout, [item.slot]: item.id }
}
