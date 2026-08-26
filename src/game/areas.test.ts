import { describe, expect, it } from 'vitest'
import {
  areaById,
  areas,
  availableAreas,
  JAVASCRIPT_AREA_ID,
  TYPESCRIPT_AREA_ID,
} from './areas'

describe('area definitions', () => {
  it('Area idが一意でlookupと一致する', () => {
    expect(new Set(areas.map((area) => area.id)).size).toBe(areas.length)

    for (const area of areas) {
      expect(areaById[area.id]).toBe(area)
    }
  })

  it('available Areaだけが実routeを持つ', () => {
    expect(availableAreas.map((area) => area.id)).toEqual([JAVASCRIPT_AREA_ID])

    for (const area of areas) {
      const routes = Object.values(area.routes)
      if (area.availability === 'available') {
        expect(routes.every((route) => route !== null)).toBe(true)
      } else {
        expect(routes.every((route) => route === null)).toBe(true)
      }
    }
  })

  it('JavaScript既存routeを維持しTypeScriptはCOMING SOON', () => {
    expect(areaById[JAVASCRIPT_AREA_ID]).toMatchObject({
      availability: 'available',
      routes: {
        stageSelect: '/javascript',
        field: '/javascript/field',
        complete: '/javascript/complete',
      },
      bossBattleId: 3,
    })
    expect(areaById[TYPESCRIPT_AREA_ID]).toMatchObject({
      availability: 'comingSoon',
      routes: {
        stageSelect: null,
        field: null,
        complete: null,
      },
    })
  })
})
