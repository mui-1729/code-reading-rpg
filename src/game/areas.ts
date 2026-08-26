export const JAVASCRIPT_AREA_ID = 'javascript'
export const TYPESCRIPT_AREA_ID = 'typescript'

export type AreaAvailability = 'available' | 'comingSoon'

export type AreaRoutePath = '/javascript' | '/javascript/field' | '/javascript/complete'

export type AreaRoutes = {
  stageSelect: AreaRoutePath | null
  field: AreaRoutePath | null
  complete: AreaRoutePath | null
}

export type AreaDefinition = {
  id: string
  label: string
  title: string
  description: string
  availability: AreaAvailability
  routes: AreaRoutes
  bossBattleId?: number
}

export const areas: AreaDefinition[] = [
  {
    id: JAVASCRIPT_AREA_ID,
    label: 'WORLD 01',
    title: 'JavaScript Kingdom',
    description: '配列操作のコードを読み、敵の対象と優先順位を見抜く王国。',
    availability: 'available',
    routes: {
      stageSelect: '/javascript',
      field: '/javascript/field',
      complete: '/javascript/complete',
    },
    bossBattleId: 3,
  },
  {
    id: TYPESCRIPT_AREA_ID,
    label: 'WORLD 02',
    title: 'TypeScript Frontier',
    description: '型を手がかりにコードの意味を追う、次の冒険候補地。',
    availability: 'comingSoon',
    routes: {
      stageSelect: null,
      field: null,
      complete: null,
    },
  },
]

export const areaById = Object.fromEntries(areas.map((area) => [area.id, area])) as Record<
  string,
  AreaDefinition
>

export const availableAreas = areas.filter((area) => area.availability === 'available')
