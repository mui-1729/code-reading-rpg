import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { patchKitItem } from '../economy'
import { useProgress, type PlayerProgress } from '../progression'

type FeedbackViewState = {
  pathname: string
  progress: PlayerProgress
  itemRewardCount: number
}

export function WorldProgressFeedback() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { progress } = useProgress()
  const [viewState, setViewState] = useState<FeedbackViewState>(() => ({
    pathname,
    progress,
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
          <small>アイテム獲得</small>
          <strong>{patchKitItem.name} ×{viewState.itemRewardCount}</strong>
        </span>
      </section>
    )
  }

  return null
}
