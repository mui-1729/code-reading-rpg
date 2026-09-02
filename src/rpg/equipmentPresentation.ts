import {
  equipmentById,
  type EquipmentBonuses,
  type EquipmentLoadout,
} from './equipment'
import { getEquipmentVisual } from './visualAssets'

const statDefinitions = [
  { key: 'attack', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'maxHp', label: 'HP' },
] as const

export type EquipmentStatDelta = Required<EquipmentBonuses>

export type EquipmentPresentation = {
  visual: string | null
  statSummary: string
  currentEquipmentId: string | null
  currentEquipmentName: string
  delta: EquipmentStatDelta
  deltaSummary: string
}

export function formatEquipmentBonuses(bonuses: EquipmentBonuses): string {
  return statDefinitions
    .flatMap(({ key, label }) => {
      const value = bonuses[key] ?? 0
      return value === 0 ? [] : [`${label} +${value}`]
    })
    .join(' · ')
}

export function formatEquipmentDelta(delta: EquipmentStatDelta): string {
  const parts = statDefinitions.flatMap(({ key, label }) => {
    const value = delta[key]
    if (value === 0) return []
    return [`${label} ${value > 0 ? '+' : ''}${value}`]
  })
  return parts.length > 0 ? parts.join(' · ') : 'NO STAT CHANGE'
}

export function getEquipmentPresentation(
  equipmentId: string,
  loadout?: EquipmentLoadout,
): EquipmentPresentation | null {
  const equipment = equipmentById[equipmentId]
  if (!equipment) return null

  const currentEquipmentId = loadout?.[equipment.slot] ?? null
  const currentEquipment = currentEquipmentId ? equipmentById[currentEquipmentId] : undefined
  const delta: EquipmentStatDelta = {
    maxHp: (equipment.bonuses.maxHp ?? 0) - (currentEquipment?.bonuses.maxHp ?? 0),
    attack: (equipment.bonuses.attack ?? 0) - (currentEquipment?.bonuses.attack ?? 0),
    defense: (equipment.bonuses.defense ?? 0) - (currentEquipment?.bonuses.defense ?? 0),
  }
  const formattedDelta = formatEquipmentDelta(delta)

  return {
    visual: getEquipmentVisual(equipment.id),
    statSummary: formatEquipmentBonuses(equipment.bonuses),
    currentEquipmentId,
    currentEquipmentName: currentEquipment?.name ?? '未装備',
    delta,
    deltaSummary: currentEquipment ? formattedDelta : `装備すると ${formattedDelta}`,
  }
}
