import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { isAdjacent } from './worldMap'
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
  const { stats } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const combatStats = getCombatStats(stats, rpgState)
  const [targets, setTargets] = useState<RecoveryTarget[]>([])
  const [controlsTarget, setControlsTarget] = useState<Element | null>(null)
  const [message, setMessage] = useState('')

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
      setControlsTarget(document.querySelector('.world-controls'))
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

  const activeStop = useMemo(
    () =>
      targets.find(
        ({ stop }) =>
          rpgState.worldMapId === stop.mapId &&
          isAdjacent(rpgState.worldPosition, stop.position),
      )?.stop,
    [rpgState.worldMapId, rpgState.worldPosition, targets],
  )

  useEffect(() => {
    if (!controlsTarget) return
    if (activeStop) {
      controlsTarget.setAttribute('data-recovery-stop-active', activeStop.id)
    } else {
      controlsTarget.removeAttribute('data-recovery-stop-active')
    }
    return () => controlsTarget.removeAttribute('data-recovery-stop-active')
  }, [activeStop, controlsTarget])

  const recover = (stop: WorldRecoveryStop) => {
    const recoveryTarget = Math.ceil(combatStats.maxHp * stop.recoveryRatio)
    if (rpgState.currentHp >= recoveryTarget) {
      setMessage(`${stop.label}: 今は十分に休めている。`)
      return
    }
    setRpgState((current) => ({
      ...current,
      currentHp: Math.max(current.currentHp, recoveryTarget),
    }))
    setMessage(`${stop.label}: HPを${recoveryTarget}まで回復した。`)
  }

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
            <span className="recovery-stop-label">{stop.label}</span>
          </span>,
          target,
          stop.id,
        ),
      )}

      {activeStop && controlsTarget &&
        createPortal(
          <button
            type="button"
            className="primary-button world-interact recovery-stop-action"
            data-recovery-stop-action={activeStop.id}
            aria-label={activeStop.actionLabel}
            onClick={() => recover(activeStop)}
          >
            {activeStop.actionLabel}
          </button>,
          controlsTarget,
          `action:${activeStop.id}`,
        )}

      {message && (
        <div className="sr-only" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  )
}
