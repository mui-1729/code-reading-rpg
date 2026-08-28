import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { characterVisuals } from '../rpg'

export function WorldCharacterDecorations() {
  const [trainingTarget, setTrainingTarget] = useState<Element | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      setTrainingTarget(
        document.querySelector(
          '.world-viewport[data-world-map="js-village"] .training-object',
        ),
      )
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  if (!trainingTarget) return null

  return createPortal(
    <img
      src={characterVisuals.trainerMio.field}
      alt="TRAINER MIO"
      width="16"
      height="24"
      style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto 2px' }}
    />,
    trainingTarget,
  )
}
