import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useProgress, type PlayerProgress } from '../progression'
import { getQuestVictoryFeedback, getSideQuestVictoryFeedback } from './quests'
import type {
  QuestVictoryFeedback as QuestVictoryFeedbackData,
  SideQuestVictoryFeedback,
} from './types'

type FeedbackData = QuestVictoryFeedbackData | SideQuestVictoryFeedback

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  feedback: FeedbackData | null
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
        : getQuestVictoryFeedback(viewState.progress, progress) ??
          getSideQuestVictoryFeedback(viewState.progress, progress),
    })
  }

  const feedback = viewState.feedback
  const inBattle = pathname.includes('/battle/')
  if (!inBattle || !feedback) return null

  if (feedback.kind === 'sideCompleted') {
    return (
      <section
        className="quest-victory-feedback pixel-window is-complete"
        role="status"
        aria-live="polite"
      >
        <span>SIDE QUEST COMPLETE</span>
        <strong>{feedback.questTitle}</strong>
        <em>+{feedback.expGained} EXP</em>
      </section>
    )
  }

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
