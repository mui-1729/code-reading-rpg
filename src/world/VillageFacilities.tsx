import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { WorldInn } from '../economy/WorldInn'
import { VillageShop } from '../economy/VillageShop'
import { useRpg } from '../rpg'
import { JS_VILLAGE_MAP_ID } from './worldMap'
import { VILLAGE_FACILITIES, type VillageFacility, type VillageFacilityKind } from './villageFacilityData'

const VILLAGE_FACILITY_OPEN_EVENT = 'code-reading-rpg:village-facility-open'

type FacilityTarget = {
  facility: VillageFacility
  target: Element
}

export function activateVillageFacility(kind: VillageFacilityKind) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<VillageFacilityKind>(VILLAGE_FACILITY_OPEN_EVENT, { detail: kind }),
  )
}

function sameTargets(left: readonly FacilityTarget[], right: readonly FacilityTarget[]) {
  return left.length === right.length && left.every((entry, index) => {
    const candidate = right[index]
    return candidate?.facility.kind === entry.facility.kind && candidate.target === entry.target
  })
}

export function VillageFacilities() {
  const { rpgState } = useRpg()
  const [targets, setTargets] = useState<FacilityTarget[]>([])
  const [active, setActive] = useState<VillageFacilityKind | null>(null)
  const [message, setMessage] = useState('')
  const visibleActive = rpgState.worldMapId === JS_VILLAGE_MAP_ID ? active : null

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      const next = VILLAGE_FACILITIES.flatMap((facility) => {
        const target = document.querySelector(
          `.world-viewport[data-world-map="${JS_VILLAGE_MAP_ID}"] .world-tile[data-world-x="${facility.position.x}"][data-world-y="${facility.position.y}"]`,
        )
        return target ? [{ facility, target }] : []
      })
      setTargets((current) => (sameTargets(current, next) ? current : next))
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-world-x', 'data-world-y', 'data-world-map'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const openFacility = (event: Event) => {
      const facility = (event as CustomEvent<VillageFacilityKind>).detail
      if (!VILLAGE_FACILITIES.some((candidate) => candidate.kind === facility)) return
      setMessage('')
      setActive(facility)
    }
    window.addEventListener(VILLAGE_FACILITY_OPEN_EVENT, openFacility)
    return () => window.removeEventListener(VILLAGE_FACILITY_OPEN_EVENT, openFacility)
  }, [])

  useEffect(() => {
    if (!visibleActive) return
    const stopWorldKeys = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('keydown', stopWorldKeys, true)
    return () => window.removeEventListener('keydown', stopWorldKeys, true)
  }, [visibleActive])

  const close = () => setActive(null)

  return (
    <>
      {targets.map(({ facility, target }) =>
        createPortal(
          <span
            className="world-object facility-object"
            data-village-facility={facility.kind}
            aria-hidden="true"
          >
            {facility.label}
          </span>,
          target,
          facility.kind,
        ),
      )}

      <WorldInn
        open={visibleActive === 'inn'}
        onClose={close}
        onMessage={setMessage}
        locationLabel="グリーンフィールド村"
      />
      <VillageShop
        kind="items"
        open={visibleActive === 'item-shop'}
        onClose={close}
        onMessage={setMessage}
      />
      <VillageShop
        kind="equipment"
        open={visibleActive === 'equipment-shop'}
        onClose={close}
        onMessage={setMessage}
      />
      {message && (
        <div className="sr-only" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  )
}
