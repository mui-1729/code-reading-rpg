export const JAVASCRIPT_AREA_ID = 'javascript'

export type AreaDefinition = {
  id: string
  label: string
  title: string
  bossBattleId: number
}

export const areas: AreaDefinition[] = [
  {
    id: JAVASCRIPT_AREA_ID,
    label: 'WORLD 01',
    title: 'JavaScript Kingdom',
    bossBattleId: 3,
  },
]

export const areaById = Object.fromEntries(areas.map((area) => [area.id, area])) as Record<
  string,
  AreaDefinition
>
