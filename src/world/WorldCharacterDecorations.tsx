import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { characterVisuals } from '../rpg'
import { PROGRESSION_LANDMARKS } from './progressionLandmarks'

type LandmarkPortalTarget = {
  key: string
  target: Element
  label: string
  shortLabel: string
  kind: string
  battleId: number
}

export function WorldCharacterDecorations() {
  const [trainingTarget, setTrainingTarget] = useState<Element | null>(null)
  const [landmarkTargets, setLandmarkTargets] = useState<LandmarkPortalTarget[]>([])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      setTrainingTarget(
        document.querySelector(
          '.world-viewport[data-world-map="js-village"] .training-object',
        ),
      )

      setLandmarkTargets(
        PROGRESSION_LANDMARKS.flatMap((landmark) => {
          const target = document.querySelector(
            `.world-viewport[data-world-map="${landmark.mapId}"] .world-tile[data-world-x="${landmark.position.x}"][data-world-y="${landmark.position.y}"]`,
          )
          if (!target) return []
          return [
            {
              key: `${landmark.mapId}:${landmark.position.x}:${landmark.position.y}`,
              target,
              label: landmark.label,
              shortLabel: landmark.shortLabel,
              kind: landmark.kind,
              battleId: landmark.battleId,
            },
          ]
        }),
      )
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {trainingTarget &&
        createPortal(
          <img
            src={characterVisuals.trainerMio.field}
            alt="TRAINER MIO"
            width="16"
            height="24"
            style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto 2px' }}
          />,
          trainingTarget,
        )}
      {landmarkTargets.map((landmark) =>
        createPortal(
          <span
            className="world-progression-landmark"
            data-landmark-kind={landmark.kind}
            data-progression-battle={landmark.battleId}
            aria-label={landmark.label}
            title={landmark.label}
          >
            {landmark.shortLabel}
          </span>,
          landmark.target,
          landmark.key,
        ),
      )}
    </>
  )
}
