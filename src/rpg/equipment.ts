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
    description: '軽い練習剣。コードを読み切った一撃を少し強くする。',
    bonuses: { attack: 3 },
  },
  {
    id: 'guard-edge',
    name: 'Guard Edge',
    slot: 'weapon',
    description: '攻撃を少し抑え、Defenseも補う安定型の片手剣。',
    bonuses: { attack: 4, defense: 2 },
  },
  {
    id: 'branch-saber',
    name: 'Branch Saber',
    slot: 'weapon',
    description: '分岐を刻んだ剣。Defense補助を持たない代わりにAttackを大きく伸ばす。',
    bonuses: { attack: 6 },
  },
  {
    id: 'traveler-coat',
    name: 'Traveler Coat',
    slot: 'armor',
    description: '探索者用の上着。HPとDefenseを少しずつ増やす。',
    bonuses: { maxHp: 8, defense: 3 },
  },
  {
    id: 'vital-coat',
    name: 'Vital Coat',
    slot: 'armor',
    description: 'Defenseより最大HPを優先した、長期探索向けの軽装。',
    bonuses: { maxHp: 22, defense: 1 },
  },
  {
    id: 'typed-mail',
    name: 'Typed Mail',
    slot: 'armor',
    description: '型で守られた軽装。最大HPよりDefenseを重視する。',
    bonuses: { maxHp: 12, defense: 5 },
  },
  {
    id: 'debug-charm',
    name: 'Debug Charm',
    slot: 'accessory',
    description: '小さな護符。AttackとDefenseを少しずつ補う。',
    bonuses: { attack: 2, defense: 1 },
  },
  {
    id: 'life-charm',
    name: 'Life Charm',
    slot: 'accessory',
    description: '火力補助を持たず、最大HPだけを大きく伸ばす護符。',
    bonuses: { maxHp: 16 },
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
