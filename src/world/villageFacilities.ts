export type VillageFacilityKind = 'inn' | 'item-shop' | 'equipment-shop'

export type VillageFacility = {
  kind: VillageFacilityKind
  label: string
  actionLabel: string
  position: { x: number; y: number }
}

export const VILLAGE_FACILITIES: readonly VillageFacility[] = [
  {
    kind: 'inn',
    label: '宿',
    actionLabel: '宿で休む',
    position: { x: 4, y: 5 },
  },
  {
    kind: 'item-shop',
    label: '道具屋',
    actionLabel: '道具屋を見る',
    position: { x: 16, y: 5 },
  },
  {
    kind: 'equipment-shop',
    label: '装備屋',
    actionLabel: '装備屋を見る',
    position: { x: 5, y: 11 },
  },
] as const
