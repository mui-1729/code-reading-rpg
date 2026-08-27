import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useProgress, type PlayerProgress } from '../progression'
import { equipmentById } from '../rpg'
import { getWorldProgressChange, type WorldProgressFeedback as Feedback } from './worldObjective'

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  feedback: Feedback | null
}

const areaClearEquipment = {
  javascript: 'branch-saber',
  typescript: 'typed-mail',
} as const

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

  const equipmentId = feedback.kind === 'complete' ? areaClearEquipment[feedback.region] : undefined
  const equipment = equipmentId ? equipmentById[equipmentId] : undefined

  return (
    <section
      className="world-progress-feedback"
      data-result-feedback="world-progress"
      data-equipment-reward-id={equipment?.id}
      data-equipment-reward-name={equipment?.name}
      aria-hidden="true"
    >
      <span>{feedback.heading}</span>
      <strong>{feedback.label}</strong>
      <p>{feedback.progressLabel}</p>
      {feedback.next && <em>NEXT → {feedback.next}</em>}
    </section>
  )
}
