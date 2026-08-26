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

  it('available Areaだけが進入routeを持つ', () => {
    expect(availableAreas.map((area) => area.id)).toEqual([JAVASCRIPT_AREA_ID])

    for (const area of areas) {
      if (area.availability === 'available') {
        expect(area.entryPath).not.toBeNull()
      } else {
        expect(area.entryPath).toBeNull()
      }
    }
  })

  it('JavaScript Kingdomは進入可能でTypeScriptはCOMING SOON', () => {
    expect(areaById[JAVASCRIPT_AREA_ID]).toMatchObject({
      availability: 'available',
      entryPath: '/javascript/field',
      bossBattleId: 3,
    })
    expect(areaById[TYPESCRIPT_AREA_ID]).toMatchObject({
      availability: 'comingSoon',
      entryPath: null,
    })
  })
})
