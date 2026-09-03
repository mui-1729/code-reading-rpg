import { useEffect, useState } from 'react'
import { getStorySpeakerVisual } from '../rpg'
import { useModalFocus } from '../ui/useModalFocus'
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
  const dialogRef = useModalFocus<HTMLElement>({
    open: true,
    onEscape: onSkip ?? onComplete,
  })

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
      if (
        keyboardEvent.target instanceof Element &&
        keyboardEvent.target.closest('button, a, input, select, textarea')
      ) return
      keyboardEvent.preventDefault()
      advance()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!line) return null

  const layer = line.layer ?? 'code-world'
  const speakerVisual = getStorySpeakerVisual(line.speakerId)

  return (
    <div
      className="overlay modal-overlay battle-story-overlay"
      role="presentation"
      onClick={onSkip ?? onComplete}
    >
      <section
        ref={dialogRef}
        className={`dialogue-window pixel-window battle-story-window story-layer-${layer}`}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        tabIndex={-1}
        data-story-layer={layer}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="battle-story-heading">
          <span>{event.label}</span>
          <strong>{event.title}</strong>
        </div>
        <div className={`story-world-layer is-${layer}`}>{storyLayerLabels[layer]}</div>
        <div className="dialogue-speaker">
          {speakerVisual && (
            <img
              src={speakerVisual}
              alt={`${line.speaker} portrait`}
              width="48"
              height="48"
              style={{ imageRendering: 'pixelated', flex: '0 0 auto' }}
            />
          )}
          <div>
            <span>{line.role}</span>
            <strong>{line.speaker}</strong>
          </div>
          <span className="dialogue-progress">{lineIndex + 1}/{event.lines.length}</span>
        </div>
        <p>{line.text}</p>
        <div className="dialogue-actions">
          <button type="button" className="secondary-button" onClick={onSkip ?? onComplete}>スキップ</button>
          <button type="button" className="primary-button" onClick={advance}>
            {isLast ? '▶ 続ける' : '▶ 次へ'}
          </button>
        </div>
      </section>
    </div>
  )
}
