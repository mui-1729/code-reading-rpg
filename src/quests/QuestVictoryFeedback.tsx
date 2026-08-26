import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useProgress, type PlayerProgress } from '../progression'
import { getQuestVictoryFeedback } from './quests'
import type { QuestVictoryFeedback as QuestVictoryFeedbackData } from './types'

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  feedback: QuestVictoryFeedbackData | null
}

export function QuestVictoryFeedback() {
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
      feedback: routeChanged
        ? null
        : getQuestVictoryFeedback(viewState.progress, progress),
    })
  }

  const feedback = viewState.feedback
  const inBattle = pathname.includes('/battle/')
  if (!inBattle || !feedback) return null

  const completed = feedback.kind === 'completed'

  return (
    <section
      className={`quest-victory-feedback pixel-window ${completed ? 'is-complete' : 'is-updated'}`}
      role="status"
      aria-live="polite"
    >
      <span>{completed ? 'MAIN QUEST COMPLETE' : 'QUEST UPDATED'}</span>
      <strong>{feedback.questTitle}</strong>
      <p>✓ {feedback.completedStepLabel}</p>
      {feedback.nextStepLabel && <em>NEXT → {feedback.nextStepLabel}</em>}
    </section>
  )
}
