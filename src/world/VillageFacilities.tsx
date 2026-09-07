import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { WorldInn } from '../economy/WorldInn'
import { VillageShop } from '../economy/VillageShop'
import { useRpg } from '../rpg'
import { VILLAGE_FACILITY_OPEN_EVENT } from './villageFacilityEvents'
import { VILLAGE_FACILITIES, type VillageFacility, type VillageFacilityKind } from './villageFacilityData'

type FacilityTarget = {
  facility: VillageFacility
  target: Element
}

function sameTargets(left: readonly FacilityTarget[], right: readonly FacilityTarget[]) {
  return left.length === right.length && left.every((entry, index) => {
    const candidate = right[index]
    return (
      candidate?.facility.kind === entry.facility.kind &&
      candidate.facility.mapId === entry.facility.mapId &&
      candidate.target === entry.target
    )
  })
}

export function VillageFacilities() {
  const { rpgState } = useRpg()
  const [targets, setTargets] = useState<FacilityTarget[]>([])
  const [active, setActive] = useState<VillageFacilityKind | null>(null)
  const [message, setMessage] = useState('')
  const visibleFacility = useMemo(
    () =>
      active
        ? VILLAGE_FACILITIES.find(
            (facility) => facility.mapId === rpgState.worldMapId && facility.kind === active,
          ) ?? null
        : null,
    [active, rpgState.worldMapId],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      const next = VILLAGE_FACILITIES.flatMap((facility) => {
        const target = document.querySelector(
          `.world-viewport[data-world-map="${facility.mapId}"] .world-tile[data-world-x="${facility.position.x}"][data-world-y="${facility.position.y}"]`,
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
      const facilityKind = (event as CustomEvent<VillageFacilityKind>).detail
      const facility = VILLAGE_FACILITIES.find(
        (candidate) => candidate.mapId === rpgState.worldMapId && candidate.kind === facilityKind,
      )
      if (!facility) return
      setMessage('')
      setActive(facilityKind)
    }
    window.addEventListener(VILLAGE_FACILITY_OPEN_EVENT, openFacility)
    return () => window.removeEventListener(VILLAGE_FACILITY_OPEN_EVENT, openFacility)
  }, [rpgState.worldMapId])

  useEffect(() => {
    if (!visibleFacility) return
    const stopWorldKeys = (event: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Enter', ' '].includes(
          event.key,
        )
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('keydown', stopWorldKeys, true)
    return () => window.removeEventListener('keydown', stopWorldKeys, true)
  }, [visibleFacility])

  const close = () => setActive(null)

  return (
    <>
      {targets.map(({ facility, target }) =>
        createPortal(
          <span
            className="world-object facility-object"
            data-village-facility={facility.kind}
            aria-hidden="true"
            style={{ cursor: 'default', outline: 'none', outlineOffset: 0 }}
          >
            {facility.label}
          </span>,
          target,
          `${facility.mapId}:${facility.kind}`,
        ),
      )}

      <WorldInn
        open={visibleFacility?.kind === 'inn'}
        onClose={close}
        onMessage={setMessage}
        locationLabel={visibleFacility?.locationLabel}
        checkpointId={visibleFacility?.checkpointId}
      />
      <VillageShop
        kind="items"
        open={visibleFacility?.kind === 'item-shop'}
        onClose={close}
        onMessage={setMessage}
        locationLabel={visibleFacility?.locationLabel}
      />
      <VillageShop
        kind="equipment"
        open={visibleFacility?.kind === 'equipment-shop'}
        onClose={close}
        onMessage={setMessage}
        locationLabel={visibleFacility?.locationLabel}
      />
      {message && (
        <div className="sr-only" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  )
}
