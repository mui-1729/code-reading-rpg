import type { VillageFacilityKind } from './villageFacilityData'

export const VILLAGE_FACILITY_OPEN_EVENT = 'code-reading-rpg:village-facility-open'

export function activateVillageFacility(kind: VillageFacilityKind) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<VillageFacilityKind>(VILLAGE_FACILITY_OPEN_EVENT, { detail: kind }),
  )
}
