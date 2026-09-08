import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { WORLD_RECOVERY_STOPS, type WorldRecoveryStop } from './recoveryStops'
import './world-recovery-stops.css'

type RecoveryTarget = {
  stop: WorldRecoveryStop
  target: Element
}

type Facing = 'up' | 'down' | 'left' | 'right'

function sameTargets(left: readonly RecoveryTarget[], right: readonly RecoveryTarget[]) {
  return left.length === right.length && left.every((entry, index) => {
    const candidate = right[index]
    return candidate?.stop.id === entry.stop.id && candidate.target === entry.target
  })
}

function getFacingTarget(position: { x: number; y: number }, facing: Facing) {
  if (facing === 'up') return { x: position.x, y: position.y - 1 }
  if (facing === 'down') return { x: position.x, y: position.y + 1 }
  if (facing === 'left') return { x: position.x - 1, y: position.y }
  return { x: position.x + 1, y: position.y }
}

export function WorldRecoveryStops() {
  const { stats } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const combatStats = getCombatStats(stats, rpgState)
  const [targets, setTargets] = useState<RecoveryTarget[]>([])
  const [controlsTarget, setControlsTarget] = useState<Element | null>(null)
  const [facing, setFacing] = useState<Facing>('down')
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

      const player = document.querySelector('.world-player-sprite')
      const nextFacing = player?.getAttribute('data-facing')
      if (nextFacing === 'up' || nextFacing === 'down' || nextFacing === 'left' || nextFacing === 'right') {
        setFacing(nextFacing)
      }
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-world-x', 'data-world-y', 'data-world-map', 'data-facing'],
    })
    return () => observer.disconnect()
  }, [])

  const activeStop = useMemo(() => {
    const target = getFacingTarget(rpgState.worldPosition, facing)
    return targets.find(
      ({ stop }) =>
        rpgState.worldMapId === stop.mapId &&
        stop.position.x === target.x &&
        stop.position.y === target.y,
    )?.stop
  }, [facing, rpgState.worldMapId, rpgState.worldPosition, targets])

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
