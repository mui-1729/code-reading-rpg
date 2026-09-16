import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStorySpeakerVisual } from '../rpg'
import { useSceneTransition } from '../transition/useSceneTransition'
import { useModalFocus } from '../ui/useModalFocus'
import { getStoryLayerTransitionKind } from './storyLayerTransition'
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
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  const line = event.lines[lineIndex]
  const layer = line?.layer ?? 'code-world'
  const isLast = lineIndex === event.lines.length - 1
  const containsReturn = useMemo(
    () => event.lines.some((candidate) => candidate.layer === 'return'),
    [event.lines],
  )
  const activeTransitionKind = typeof document === 'undefined'
    ? undefined
    : document.body.dataset.sceneTransitionKind
  const storyOwnsTransition =
    activeTransitionKind === 'connect' || activeTransitionKind === 'return-real-world'
  const controlsDisabled = isTransitioning && !storyOwnsTransition

  const completeStory = useCallback((skip: boolean) => {
    if (isTransitioning) return
    const complete = skip ? (onSkip ?? onComplete) : onComplete

    const transitionKind = containsReturn && layer !== 'real-world'
      ? 'return-real-world'
      : !containsReturn && (layer === 'real-world' || layer === 'remote' || layer === 'connect')
        ? 'connect'
        : null

    if (!transitionKind) {
      complete()
      return
    }

    void runSceneTransition(
      transitionKind,
      complete,
      {
        label: transitionKind === 'connect'
          ? 'CONNECT // CODE WORLD'
          : 'RETURN // REAL WORLD',
      },
    )
  }, [containsReturn, isTransitioning, layer, onComplete, onSkip, runSceneTransition])

  const dialogRef = useModalFocus<HTMLElement>({
    open: true,
    onEscape: () => completeStory(true),
  })

  const advance = useCallback(() => {
    if (isTransitioning || !line) return
    if (isLast) {
      completeStory(false)
      return
    }

    const nextLine = event.lines[lineIndex + 1]
    const nextLayer = nextLine?.layer ?? 'code-world'
    const transitionKind = getStoryLayerTransitionKind(layer, nextLayer)
    const swap = () => setLineIndex((current) => current + 1)

    if (!transitionKind) {
      swap()
      return
    }

    void runSceneTransition(
      transitionKind,
      swap,
      {
        label: transitionKind === 'connect'
          ? 'CONNECT // CODE WORLD'
          : 'RETURN // REAL WORLD',
      },
    )
  }, [completeStory, event.lines, isLast, isTransitioning, layer, line, lineIndex, runSceneTransition])

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
  }, [advance])

  if (!line) return null

  const speakerVisual = getStorySpeakerVisual(line.speakerId)

  return (
    <div
      className="overlay modal-overlay battle-story-overlay"
      role="presentation"
      onClick={() => completeStory(true)}
    >
      <section
        ref={dialogRef}
        className={`dialogue-window pixel-window battle-story-window story-layer-${layer}`}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        tabIndex={-1}
        data-story-layer={layer}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
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
          <button type="button" className="secondary-button" onClick={() => completeStory(true)} disabled={controlsDisabled}>スキップ</button>
          <button type="button" className="primary-button" onClick={advance} disabled={controlsDisabled}>
            {isLast ? '▶ 続ける' : '▶ 次へ'}
          </button>
        </div>
      </section>
    </div>
  )
}
