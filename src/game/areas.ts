export const JAVASCRIPT_AREA_ID = 'javascript'
export const TYPESCRIPT_AREA_ID = 'typescript'
export const DATABASE_AREA_ID = 'database'

export type AreaAvailability = 'available' | 'comingSoon'

export type AreaRoutePath = '/javascript/field' | '/typescript/field' | '/database/field'

export type AreaRoutes = {
  field: AreaRoutePath | null
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
      field: '/javascript/field',
    },
    bossBattleId: 3,
  },
  {
    id: TYPESCRIPT_AREA_ID,
    label: 'WORLD 02',
    title: 'TypeScript Frontier',
    description: '型注釈・union・narrowingを手がかりに、実行結果まで追う辺境地。',
    availability: 'available',
    routes: {
      field: '/typescript/field',
    },
    bossBattleId: 6,
  },
  {
    id: DATABASE_AREA_ID,
    label: 'WORLD 03',
    title: 'Database Archive',
    description: 'archiveに蓄積されたrowとqueryを読み、条件・並び順・取得件数から結果を特定する保管区。',
    availability: 'available',
    routes: {
      field: '/database/field',
    },
  },
]

export const areaById = Object.fromEntries(areas.map((area) => [area.id, area])) as Record<
  string,
  AreaDefinition
>

export const availableAreas = areas.filter((area) => area.availability === 'available')
