import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { WorldInn } from '../economy/WorldInn'
import { VillageShop } from '../economy/VillageShop'
import { useRpg } from '../rpg'
import { isAdjacent, JS_VILLAGE_MAP_ID } from './worldMap'
import { VILLAGE_FACILITIES, type VillageFacility, type VillageFacilityKind } from './villageFacilities'

type FacilityTarget = {
  facility: VillageFacility
  target: Element
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
    if (rpgState.worldMapId !== JS_VILLAGE_MAP_ID) setActive(null)
  }, [rpgState.worldMapId])

  useEffect(() => {
    if (!active) return
    const stopWorldKeys = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('keydown', stopWorldKeys, true)
    return () => window.removeEventListener('keydown', stopWorldKeys, true)
  }, [active])

  const close = () => setActive(null)
  const position = rpgState.worldPosition

  return (
    <>
      {targets.map(({ facility, target }) => {
        const available =
          rpgState.worldMapId === JS_VILLAGE_MAP_ID &&
          isAdjacent(position, facility.position)
        return createPortal(
          <button
            type="button"
            className="world-object facility-object"
            data-village-facility={facility.kind}
            aria-label={facility.actionLabel}
            disabled={!available}
            onClick={() => {
              setMessage('')
              setActive(facility.kind)
            }}
            style={{
              border: '1px solid currentColor',
              padding: '2px 4px',
              cursor: available ? 'pointer' : 'default',
              opacity: available ? 1 : 0.82,
              font: 'inherit',
            }}
          >
            {facility.label}
          </button>,
          target,
          facility.kind,
        )
      })}

      <WorldInn
        open={active === 'inn'}
        onClose={close}
        onMessage={setMessage}
        locationLabel="グリーンフィールド村"
      />
      <VillageShop
        kind="items"
        open={active === 'item-shop'}
        onClose={close}
        onMessage={setMessage}
      />
      <VillageShop
        kind="equipment"
        open={active === 'equipment-shop'}
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
