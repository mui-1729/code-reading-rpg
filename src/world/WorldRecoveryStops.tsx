import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { WORLD_RECOVERY_STOPS, type WorldRecoveryStop } from './recoveryStops'
import './world-recovery-stops.css'

type RecoveryTarget = {
  stop: WorldRecoveryStop
  target: Element
}

function sameTargets(left: readonly RecoveryTarget[], right: readonly RecoveryTarget[]) {
  return left.length === right.length && left.every((entry, index) => {
    const candidate = right[index]
    return candidate?.stop.id === entry.stop.id && candidate.target === entry.target
  })
}

export function WorldRecoveryStops() {
  const [targets, setTargets] = useState<RecoveryTarget[]>([])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const sync = () => {
      const next = WORLD_RECOVERY_STOPS.flatMap((stop) => {
        const target = document.querySelector(
          `.world-viewport[data-world-map="${stop.mapId}"] .world-tile[data-world-x="${stop.position.x}"][data-world-y="${stop.position.y}"]`,
        )
        return target ? [{ stop, target }] : []
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

  return (
    <>
      {targets.map(({ stop, target }) =>
        createPortal(
          <span
            className="world-object recovery-stop-object"
            data-recovery-stop={stop.id}
            aria-hidden="true"
            title={stop.label}
          >
            <span className="recovery-stop-detail" />
          </span>,
          target,
          stop.id,
        ),
      )}
    </>
  )
}
