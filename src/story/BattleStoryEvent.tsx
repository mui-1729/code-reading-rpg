import { useEffect, useState } from 'react'
import type {
  BattleStoryEvent as BattleStoryEventData,
  StoryWorldLayer,
} from './types'

type BattleStoryEventProps = {
  event: BattleStoryEventData
  onComplete: () => void
  onSkip?: () => void
}

const storyLayerLabels: Record<StoryWorldLayer, string> = {
  'real-world': 'REAL WORLD',
  connect: 'CONNECT',
  'code-world': 'CODE WORLD',
  remote: 'REMOTE LINK',
  return: 'RETURN // REAL WORLD',
}

export function BattleStoryEvent({ event, onComplete, onSkip }: BattleStoryEventProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const line = event.lines[lineIndex]
  const isLast = lineIndex === event.lines.length - 1

  const advance = () => {
    if (isLast) {
      onComplete()
      return
    }
    setLineIndex((current) => current + 1)
  }

  useEffect(() => {
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return
      keyboardEvent.preventDefault()
      advance()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!line) return null

  const layer = line.layer ?? 'code-world'

  return (
    <div className="overlay modal-overlay battle-story-overlay" role="presentation">
      <section
        className={`dialogue-window pixel-window battle-story-window story-layer-${layer}`}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        data-story-layer={layer}
      >
        <div className="battle-story-heading">
          <span>{event.label}</span>
          <strong>{event.title}</strong>
        </div>
        <div className={`story-world-layer is-${layer}`}>{storyLayerLabels[layer]}</div>
        <div className="dialogue-speaker">
          <div>
            <span>{line.role}</span>
            <strong>{line.speaker}</strong>
          </div>
          <span className="dialogue-progress">{lineIndex + 1}/{event.lines.length}</span>
        </div>
        <p>{line.text}</p>
        <div className="dialogue-actions">
          <button type="button" className="secondary-button" onClick={onSkip ?? onComplete}>SKIP</button>
          <button type="button" className="primary-button" onClick={advance}>
            {isLast ? '▶ CONTINUE' : '▶ NEXT'}
          </button>
        </div>
      </section>
    </div>
  )
}
