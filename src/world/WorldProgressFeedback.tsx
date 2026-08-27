import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { patchKitItem } from '../economy'
import { useProgress, type PlayerProgress } from '../progression'
import { equipmentById } from '../rpg'
import { getWorldProgressChange, type WorldProgressFeedback as Feedback } from './worldObjective'

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  feedback: Feedback | null
  itemRewardCount: number
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
    itemRewardCount: 0,
  }))

  if (viewState.pathname !== pathname || viewState.progress !== progress) {
    const routeChanged = viewState.pathname !== pathname
    const patchKitDelta = progress.inventory.patchKit - viewState.progress.inventory.patchKit
    const treasureItemReward =
      !routeChanged && patchKitDelta > 0 && progress.gold >= viewState.progress.gold
        ? patchKitDelta
        : 0

    setViewState({
      pathname,
      progress,
      feedback: routeChanged ? null : getWorldProgressChange(viewState.progress, progress),
      itemRewardCount: treasureItemReward,
    })
  }

  useEffect(() => {
    if (viewState.itemRewardCount <= 0) return
    const timeout = window.setTimeout(() => {
      setViewState((current) =>
        current.itemRewardCount > 0 ? { ...current, itemRewardCount: 0 } : current,
      )
    }, 2800)
    return () => window.clearTimeout(timeout)
  }, [viewState.itemRewardCount])

  if (pathname === '/world' && viewState.itemRewardCount > 0) {
    return (
      <section
        className="world-progress-feedback world-item-reward-feedback world-item-reward"
        data-item-reward-id={patchKitItem.id}
        data-item-reward-count={viewState.itemRewardCount}
        role="status"
        aria-live="polite"
      >
        <img className="item-pixel-icon" src={patchKitItem.visual} alt="" aria-hidden="true" />
        <span>
          <small>ITEM ACQUIRED</small>
          <strong>{patchKitItem.name} ×{viewState.itemRewardCount}</strong>
        </span>
      </section>
    )
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
