import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useProgress, type PlayerProgress } from '../progression'
import { getWorldProgressChange, type WorldProgressFeedback as Feedback } from './worldObjective'

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  feedback: Feedback | null
}

export function WorldProgressFeedback() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { progress } = useProgress()
  const [viewState, setViewState] = useState<FeedbackViewState>(() => ({
    pathname,
    progress,
    feedback: null,
  }))

  if (viewState.pathname !== pathname || viewState.progress !== progress) {
    const routeChanged = viewState.pathname !== pathname
    setViewState({
      pathname,
      progress,
      feedback: routeChanged ? null : getWorldProgressChange(viewState.progress, progress),
    })
  }

  const feedback = viewState.feedback
  if (!pathname.includes('/battle/') || !feedback) return null

  return (
    <section
      className="world-progress-feedback"
      data-result-feedback="world-progress"
      aria-hidden="true"
    >
      <span>{feedback.heading}</span>
      <strong>{feedback.label}</strong>
      <p>{feedback.progressLabel}</p>
      {feedback.next && <em>NEXT → {feedback.next}</em>}
    </section>
  )
}
