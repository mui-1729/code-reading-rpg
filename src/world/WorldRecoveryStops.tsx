import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { isAdjacent } from './worldMap'
import { WORLD_RECOVERY_STOPS, type WorldRecoveryStop } from './recoveryStops'

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
      {targets.map(({ stop, target }) => {
        const available =
          rpgState.worldMapId === stop.mapId &&
          isAdjacent(rpgState.worldPosition, stop.position)
        const recoveryTarget = Math.ceil(combatStats.maxHp * stop.recoveryRatio)
        const canRecover = rpgState.currentHp < recoveryTarget

        return createPortal(
          <button
            type="button"
            className="world-object recovery-stop-object"
            data-recovery-stop={stop.id}
            aria-label={stop.actionLabel}
            disabled={!available}
            onClick={() => {
              if (!available) return
              if (!canRecover) {
                setMessage(`${stop.label}: 今は十分に休めている。`)
                return
              }
              setRpgState((current) => ({
                ...current,
                currentHp: Math.max(current.currentHp, recoveryTarget),
              }))
              setMessage(`${stop.label}: HPを${recoveryTarget}まで回復した。`)
            }}
            title={`${stop.label} · 無料でHPを60%まで回復`}
            style={{
              border: '1px solid currentColor',
              padding: '2px 4px',
              cursor: available ? 'pointer' : 'default',
              opacity: available ? 1 : 0.82,
              font: 'inherit',
            }}
          >
            {stop.label}
          </button>,
          target,
          stop.id,
        )
      })}
      {message && (
        <div className="sr-only" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  )
}
